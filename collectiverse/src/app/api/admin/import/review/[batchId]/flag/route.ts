import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { batchId: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const batch = await (prisma as any).importBatch.findUnique({ where: { id: params.batchId } });
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

  const body = await req.json();
  const { cardIds, reason } = body;

  // Flag specific cards for review
  if (cardIds?.length > 0) {
    await (prisma as any).card.updateMany({
      where: { id: { in: cardIds } },
      data: { status: 'needs_review' },
    });
  }

  return NextResponse.json({ success: true, flaggedCards: cardIds?.length || 0, reason });
}
