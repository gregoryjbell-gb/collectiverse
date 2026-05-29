import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { findOrCreateIdentity } from '@/lib/card-fingerprint';

export async function POST(req: NextRequest, { params }: { params: { batchId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const batch = await (prisma as any).inventoryImportBatch.findFirst({ where: { id: params.batchId, userId } });
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  if (!['PREVIEWED', 'MAPPED'].includes(batch.status)) {
    return NextResponse.json({ error: 'Batch must be previewed before confirming' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const createNewCards = body.createNewCards !== false; // default true

  // Get all importable rows (matched + create_card_required if user opted in)
  const matchedRows = await (prisma as any).inventoryImportRow.findMany({
    where: { batchId: params.batchId, status: 'MATCHED_CARD' },
  });

  const newCardRows = createNewCards
    ? await (prisma as any).inventoryImportRow.findMany({ where: { batchId: params.batchId, status: 'CREATE_CARD_REQUIRED' } })
    : [];

  let imported = 0;
  let createdCards = 0;

  // Import matched rows
  for (const row of matchedRows) {
    if (!row.matchedCardId || !row.mappedJson) continue;
    const mapped = JSON.parse(row.mappedJson);

    try {
      const inventoryItem = await createInventoryItem(userId, row.matchedCardId, mapped);
      await (prisma as any).inventoryImportRow.update({
        where: { id: row.id },
        data: { status: 'IMPORTED', createdInventoryItemId: inventoryItem.id },
      });
      imported++;
    } catch (err: any) {
      await (prisma as any).inventoryImportRow.update({
        where: { id: row.id },
        data: { status: 'ERROR', errorMessage: err.message },
      });
    }
  }

  // Create provisional cards for unmatched rows and import
  for (const row of newCardRows) {
    if (!row.mappedJson) continue;
    const mapped = JSON.parse(row.mappedJson);

    try {
      // Find or create person
      let person = null;
      if (mapped.subjectName) {
        person = await (prisma as any).person.findFirst({ where: { displayName: { equals: mapped.subjectName, mode: 'insensitive' } } });
        if (!person) {
          person = await (prisma as any).person.create({ data: { displayName: mapped.subjectName, subjectType: 'ATHLETE' } });
        }
      }

      // Find or create set
      let cardSet = null;
      if (mapped.setName && mapped.year) {
        cardSet = await (prisma as any).cardSet.findFirst({ where: { name: mapped.setName, year: parseInt(mapped.year) } });
        if (!cardSet) {
          cardSet = await (prisma as any).cardSet.create({
            data: { name: mapped.setName, year: parseInt(mapped.year), manufacturer: mapped.manufacturer || null },
          });
        }
      }

      // Find or create team
      let team = null;
      if (mapped.team) {
        team = await (prisma as any).team.findFirst({ where: { name: { equals: mapped.team, mode: 'insensitive' } } });
      }

      // Create provisional public card
      const card = await (prisma as any).card.create({
        data: {
          personId: person?.id || null,
          setId: cardSet?.id || null,
          teamId: team?.id || null,
          year: mapped.year ? parseInt(mapped.year) : null,
          cardNumber: mapped.cardNumber || null,
          parallel: mapped.parallel || null,
          rookie: mapped.rookie === 'true',
          autograph: mapped.autograph === 'true',
          relic: mapped.relic === 'true',
          cardCategory: mapped.cardCategory || 'SPORTS',
          collectibleType: 'SPORTS_CARD',
          status: 'hold',
          publicDataStatus: 'USER_IMPORTED',
          sourceType: 'USER_INVENTORY_IMPORT',
          createdFromImportBatchId: params.batchId,
          createdByUserId: userId,
        },
      });
      createdCards++;

      // Create review queue entry for admin
      await (prisma as any).publicCardReview.create({
        data: {
          cardId: card.id,
          submittedByUserId: userId,
          importBatchId: params.batchId,
          status: 'PENDING',
        },
      }).catch(() => {});

      // Create card identity
      await findOrCreateIdentity({
        cardId: card.id,
        year: mapped.year ? parseInt(mapped.year) : null,
        manufacturer: mapped.manufacturer,
        setName: mapped.setName,
        cardNumber: mapped.cardNumber,
        subjectName: mapped.subjectName,
        parallel: mapped.parallel,
        variation: mapped.variation,
      }).catch(() => {});

      // Create inventory item linked to new card
      const inventoryItem = await createInventoryItem(userId, card.id, mapped);
      await (prisma as any).inventoryImportRow.update({
        where: { id: row.id },
        data: { status: 'IMPORTED', matchedCardId: card.id, createdInventoryItemId: inventoryItem.id },
      });
      imported++;
    } catch (err: any) {
      await (prisma as any).inventoryImportRow.update({
        where: { id: row.id },
        data: { status: 'ERROR', errorMessage: err.message },
      });
    }
  }

  await (prisma as any).inventoryImportBatch.update({
    where: { id: params.batchId },
    data: { status: 'IMPORTED', completedAt: new Date() },
  });

  return NextResponse.json({ success: true, imported, createdCards, total: matchedRows.length + newCardRows.length });
}

async function createInventoryItem(userId: string, cardId: string, mapped: any) {
  return (prisma as any).inventoryItem.create({
    data: {
      userId,
      cardId,
      quantity: mapped.quantity ? parseInt(mapped.quantity) : 1,
      condition: mapped.condition || null,
      gradeCompany: mapped.gradeCompany || null,
      gradeValue: mapped.gradeValue || null,
      certNumber: mapped.certNumber || null,
      acquisitionDate: mapped.acquisitionDate ? new Date(mapped.acquisitionDate) : null,
      purchasePrice: mapped.purchasePrice ? parseFloat(mapped.purchasePrice) : null,
      estimatedValue: mapped.estimatedValue ? parseFloat(mapped.estimatedValue) : null,
      askingPrice: mapped.askingPrice ? parseFloat(mapped.askingPrice) : null,
      status: mapped.status || 'OWNED',
      storageLocation: mapped.storageLocation || null,
      notes: mapped.notes || null,
    },
  });
}
