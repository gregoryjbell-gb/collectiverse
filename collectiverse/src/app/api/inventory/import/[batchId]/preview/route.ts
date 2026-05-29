import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { classifyImportMatch } from '@/lib/import-matching';

export async function POST(_req: NextRequest, { params }: { params: { batchId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const batch = await (prisma as any).inventoryImportBatch.findFirst({ where: { id: params.batchId, userId } });
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

  const rows = await (prisma as any).inventoryImportRow.findMany({ where: { batchId: params.batchId } });

  let exactMatch = 0;
  let highConfidence = 0;
  let possibleMatch = 0;
  let noMatch = 0;
  let errors = 0;
  let duplicates = 0;

  for (const row of rows) {
    if (!row.mappedJson) { errors++; await updateRow(row.id, 'ERROR', null, null, null, null, 'No mapped data'); continue; }
    const mapped = JSON.parse(row.mappedJson);

    if (!mapped.subjectName && !mapped.cardNumber) {
      errors++;
      await updateRow(row.id, 'ERROR', null, null, null, null, 'Missing subject name and card number');
      continue;
    }

    // Run confidence matching
    const result = await classifyImportMatch(mapped);

    if (result.cardId) {
      // Check for duplicate inventory
      const existingInv = await (prisma as any).inventoryItem.findFirst({
        where: {
          userId, cardId: result.cardId,
          ...(mapped.gradeCompany ? { gradeCompany: mapped.gradeCompany } : {}),
          ...(mapped.gradeValue ? { gradeValue: mapped.gradeValue } : {}),
          ...(mapped.certNumber ? { certNumber: mapped.certNumber } : {}),
        },
      });

      if (existingInv && result.status === 'EXACT_MATCH') {
        duplicates++;
        await updateRow(row.id, 'SKIPPED_DUPLICATE', result.cardId, result.confidence, result.status, result.candidates, null);
        continue;
      }
    }

    switch (result.status) {
      case 'EXACT_MATCH':
        exactMatch++;
        await updateRow(row.id, 'MATCHED_CARD', result.cardId, result.confidence, 'EXACT_MATCH', result.candidates, null);
        break;
      case 'HIGH_CONFIDENCE':
        highConfidence++;
        await updateRow(row.id, 'MATCHED_CARD', result.cardId, result.confidence, 'HIGH_CONFIDENCE', result.candidates, null);
        break;
      case 'POSSIBLE_MATCH':
        possibleMatch++;
        await updateRow(row.id, 'MATCHED_CARD', result.cardId, result.confidence, 'POSSIBLE_MATCH', result.candidates, null);
        break;
      case 'NO_MATCH':
        noMatch++;
        await updateRow(row.id, 'CREATE_CARD_REQUIRED', null, result.confidence, 'NO_MATCH', result.candidates, null);
        break;
    }
  }

  const matched = exactMatch + highConfidence;

  await (prisma as any).inventoryImportBatch.update({
    where: { id: params.batchId },
    data: { status: 'PREVIEWED', matchedRows: matched, newCardRows: noMatch, errorRows: errors, duplicateRows: duplicates },
  });

  return NextResponse.json({
    matched, exactMatch, highConfidence, possibleMatch, noMatch, errors, duplicates,
    total: rows.length,
  });
}

async function updateRow(
  id: string, status: string, cardId: string | null,
  confidence: number | null, matchStatus: string | null,
  candidates: any[] | null, error: string | null
) {
  await (prisma as any).inventoryImportRow.update({
    where: { id },
    data: {
      status,
      matchedCardId: cardId,
      matchConfidence: confidence,
      matchStatus,
      candidateMatchesJson: candidates && candidates.length > 0 ? JSON.stringify(candidates) : null,
      errorMessage: error,
    },
  });
}
