import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { batchId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const batch = await (prisma as any).inventoryImportBatch.findFirst({ where: { id: params.batchId, userId } });
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  if (!['PREVIEWED', 'MAPPED'].includes(batch.status)) {
    return NextResponse.json({ error: 'Batch must be previewed before confirming' }, { status: 400 });
  }

  const rows = await (prisma as any).inventoryImportRow.findMany({
    where: { batchId: params.batchId, status: 'MATCHED_CARD' },
  });

  let imported = 0;

  for (const row of rows) {
    if (!row.matchedCardId || !row.mappedJson) continue;
    const mapped = JSON.parse(row.mappedJson);

    try {
      const inventoryItem = await (prisma as any).inventoryItem.create({
        data: {
          userId,
          cardId: row.matchedCardId,
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

  await (prisma as any).inventoryImportBatch.update({
    where: { id: params.batchId },
    data: { status: 'IMPORTED', completedAt: new Date() },
  });

  return NextResponse.json({ success: true, imported, total: rows.length });
}
