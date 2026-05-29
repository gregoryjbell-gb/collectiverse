import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const bidderUserId = await ensureUserId(session);

  const event = await (prisma as any).liveEvent.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  if (event.sellerUserId === bidderUserId) return NextResponse.json({ error: 'Cannot bid on your own item' }, { status: 400 });

  const item = await (prisma as any).liveEventItem.findUnique({ where: { id: params.itemId } });
  if (!item || item.status !== 'AUCTION_ACTIVE') return NextResponse.json({ error: 'Auction is not active' }, { status: 400 });

  // Check auction hasn't ended
  if (item.auctionEndAt && new Date() > new Date(item.auctionEndAt)) {
    return NextResponse.json({ error: 'Auction has ended' }, { status: 400 });
  }

  const body = await req.json();
  const amount = parseFloat(body.amount);

  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid bid amount' }, { status: 400 });

  // Validate bid is higher than current + increment
  const currentPrice = item.currentPrice || item.startingPrice || 0;
  const increment = item.minimumBidIncrement || 1;
  if (amount < currentPrice + increment) {
    return NextResponse.json({ error: `Bid must be at least $${(currentPrice + increment).toFixed(2)}` }, { status: 400 });
  }

  // Mark previous winning bid as OUTBID
  if (item.winningBidId) {
    await (prisma as any).liveBid.update({ where: { id: item.winningBidId }, data: { status: 'OUTBID' } });
  }

  // Create new bid
  const bid = await (prisma as any).liveBid.create({
    data: {
      liveEventId: params.id,
      liveEventItemId: params.itemId,
      bidderUserId,
      sellerUserId: event.sellerUserId,
      amount,
      status: 'WINNING',
    },
  });

  // Update item with new winning bid
  await (prisma as any).liveEventItem.update({
    where: { id: params.itemId },
    data: { currentPrice: amount, winningBidId: bid.id, winningUserId: bidderUserId },
  });

  // Chat message
  const bidder = await (prisma as any).user.findUnique({ where: { id: bidderUserId }, select: { displayName: true, username: true } });
  await (prisma as any).liveEventMessage.create({
    data: { liveEventId: params.id, userId: bidderUserId, messageType: 'SYSTEM', message: `💰 ${bidder?.displayName || bidder?.username || 'Bidder'} bid $${amount.toFixed(2)}` },
  });

  return NextResponse.json({ bid, currentPrice: amount }, { status: 201 });
}
