import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { checkExistingCard } from '@/lib/card-fingerprint';

export async function POST(_req: NextRequest, { params }: { params: { batchId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const batch = await (prisma as any).inventoryImportBatch.findFirst({ where: { id: params.batchId, userId } });
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

  const rows = await (prisma as any).inventoryImportRow.findMany({ where: { batchId: params.batchId } });

  let matched = 0;
  let newCard = 0;
  let errors = 0;
  let duplicates = 0;

  for (const row of rows) {
    if (!row.mappedJson) { errors++; await updateRow(row.id, 'ERROR', null, 'No mapped data'); continue; }
    const mapped = JSON.parse(row.mappedJson);

    if (!mapped.subjectName && !mapped.cardNumber) {
      errors++;
      await updateRow(row.id, 'ERROR', null, 'Missing subject name and card number');
      continue;
    }

    // Try to match to existing card
    const existingCardId = await checkExistingCard({
      year: mapped.year, manufacturer: mapped.manufacturer, setName: mapped.setName,
      cardNumber: mapped.cardNumber, subjectName: mapped.subjectName,
      parallel: mapped.parallel, variation: mapped.variation,
    });

    if (existingCardId) {
      // Check for duplicate inventory
      const existingInv = await (prisma as any).inventoryItem.findFirst({
        where: {
          userId, cardId: existingCardId,
          ...(mapped.gradeCompany ? { gradeCompany: mapped.gradeCompany } : {}),
          ...(mapped.gradeValue ? { gradeValue: mapped.gradeValue } : {}),
          ...(mapped.certNumber ? { certNumber: mapped.certNumber } : {}),
        },
      });
      if (existingInv) {
        duplicates++;
        await updateRow(row.id, 'SKIPPED_DUPLICATE', existingCardId, null);
      } else {
        matched++;
        await updateRow(row.id, 'MATCHED_CARD', existingCardId, null);
      }
    } else {
      // Try fuzzy match by person + set + cardNumber
      let fuzzyMatch = null;
      if (mapped.subjectName && mapped.cardNumber) {
        const person = await (prisma as any).person.findFirst({ where: { displayName: { equals: mapped.subjectName, mode: 'insensitive' } } });
        if (person) {
          fuzzyMatch = await (prisma as any).card.findFirst({
            where: { personId: person.id, cardNumber: mapped.cardNumber },
          });
        }
      }
      if (fuzzyMatch) {
        matched++;
        await updateRow(row.id, 'MATCHED_CARD', fuzzyMatch.id, null);
      } else {
        newCard++;
        await updateRow(row.id, 'CREATE_CARD_REQUIRED', null, null);
      }
    }
  }

  await (prisma as any).inventoryImportBatch.update({
    where: { id: params.batchId },
    data: { status: 'PREVIEWED', matchedRows: matched, newCardRows: newCard, errorRows: errors, duplicateRows: duplicates },
  });

  return NextResponse.json({ matched, newCard, errors, duplicates, total: rows.length });
}

async function updateRow(id: string, status: string, cardId: string | null, error: string | null) {
  await (prisma as any).inventoryImportRow.update({
    where: { id },
    data: { status, matchedCardId: cardId, errorMessage: error },
  });
}
