import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { batchId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const batch = await (prisma as any).inventoryImportBatch.findFirst({ where: { id: params.batchId, userId } });
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

  const body = await req.json();
  const { fieldMap } = body; // { sourceColumn: targetField }

  if (!fieldMap) return NextResponse.json({ error: 'fieldMap is required' }, { status: 400 });

  // Apply mapping to all rows
  const rows = await (prisma as any).inventoryImportRow.findMany({ where: { batchId: params.batchId } });

  for (const row of rows) {
    const raw = JSON.parse(row.rawJson);
    const mapped: any = {};
    for (const [sourceCol, targetField] of Object.entries(fieldMap)) {
      if (targetField && raw[sourceCol] !== undefined) {
        mapped[targetField as string] = raw[sourceCol];
      }
    }
    await (prisma as any).inventoryImportRow.update({
      where: { id: row.id },
      data: { mappedJson: JSON.stringify(mapped), status: 'NEEDS_MAPPING' },
    });
  }

  await (prisma as any).inventoryImportBatch.update({
    where: { id: params.batchId },
    data: { status: 'MAPPED', fieldMap: JSON.stringify(fieldMap) },
  });

  return NextResponse.json({ success: true, mappedRows: rows.length });
}
