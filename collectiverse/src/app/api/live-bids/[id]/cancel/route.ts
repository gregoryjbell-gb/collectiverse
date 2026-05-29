import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const bid = await (prisma as any).liveBid.findUnique({ where: { id: params.id } });
  if (!bid) return NextResponse.json({ error: 'Bid not found' }, { status: 404 });

  // Seller or admin can cancel
  if (bid.sellerUserId !== userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only seller or admin can cancel bids' }, { status: 403 });
  }

  await (prisma as any).liveBid.update({ where: { id: params.id }, data: { status: 'CANCELLED' } });

  // If this was the winning bid, find next highest
  const item = await (prisma as any).liveEventItem.findUnique({ where: { id: bid.liveEventItemId } });
  if (item?.winningBidId === params.id) {
    const nextBid = await (prisma as any).liveBid.findFirst({
      where: { liveEventItemId: bid.liveEventItemId, status: { in: ['ACTIVE', 'OUTBID'] } },
      orderBy: { amount: 'desc' },
    });
    if (nextBid) {
      await (prisma as any).liveBid.update({ where: { id: nextBid.id }, data: { status: 'WINNING' } });
      await (prisma as any).liveEventItem.update({ where: { id: bid.liveEventItemId }, data: { winningBidId: nextBid.id, winningUserId: nextBid.bidderUserId, currentPrice: nextBid.amount } });
    } else {
      await (prisma as any).liveEventItem.update({ where: { id: bid.liveEventItemId }, data: { winningBidId: null, winningUserId: null, currentPrice: item.startingPrice || 0 } });
    }
  }

  // Log moderation action
  await (prisma as any).liveEventModerationAction.create({
    data: { liveEventId: bid.liveEventId, moderatorUserId: userId, targetUserId: bid.bidderUserId, actionType: 'BID_CANCELLED', reason: null },
  });

  return NextResponse.json({ success: true });
}
