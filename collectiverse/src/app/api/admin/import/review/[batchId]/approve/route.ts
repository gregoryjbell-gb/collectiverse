import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { batchId: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const batch = await (prisma as any).importBatch.findUnique({ where: { id: params.batchId } });
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

  // Mark all cards in this batch as approved (change status from 'hold' to 'approved')
  if (batch.createdCardIds?.length > 0) {
    await (prisma as any).card.updateMany({
      where: { id: { in: batch.createdCardIds } },
      data: { status: 'approved' },
    });
  }

  await (prisma as any).importBatch.update({
    where: { id: params.batchId },
    data: { status: 'COMPLETED' },
  });

  return NextResponse.json({ success: true, approvedCards: batch.createdCardIds?.length || 0 });
}
