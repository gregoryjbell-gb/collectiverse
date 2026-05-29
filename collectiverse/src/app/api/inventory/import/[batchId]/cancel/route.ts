import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { batchId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const batch = await (prisma as any).inventoryImportBatch.findFirst({ where: { id: params.batchId, userId } });
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

  await (prisma as any).inventoryImportBatch.update({
    where: { id: params.batchId },
    data: { status: 'CANCELLED' },
  });

  return NextResponse.json({ success: true });
}
