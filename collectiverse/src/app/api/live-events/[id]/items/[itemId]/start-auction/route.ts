import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const event = await (prisma as any).liveEvent.findUnique({ where: { id: params.id } });
  if (!event || event.sellerUserId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { startingPrice, reservePrice, minimumBidIncrement, durationSeconds } = body;

  const duration = durationSeconds || 60;
  const now = new Date();
  const endAt = new Date(now.getTime() + duration * 1000);

  const item = await (prisma as any).liveEventItem.update({
    where: { id: params.itemId },
    data: {
      status: 'AUCTION_ACTIVE',
      startingPrice: startingPrice ? parseFloat(startingPrice) : null,
      currentPrice: startingPrice ? parseFloat(startingPrice) : 0,
      reservePrice: reservePrice ? parseFloat(reservePrice) : null,
      minimumBidIncrement: minimumBidIncrement ? parseFloat(minimumBidIncrement) : 1,
      auctionStartAt: now,
      auctionEndAt: endAt,
    },
  });

  // System message
  await (prisma as any).liveEventMessage.create({
    data: { liveEventId: params.id, messageType: 'SYSTEM', message: `🔨 Auction started: "${item.title}" — Starting at $${startingPrice || 0}` },
  });

  return NextResponse.json({ item });
}
