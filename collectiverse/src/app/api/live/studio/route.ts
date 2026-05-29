import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  // My events
  const events = await (prisma as any).liveEvent.findMany({
    where: { sellerUserId: userId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { items: true, claims: true } } },
    take: 20,
  });

  const liveEvents = events.filter((e: any) => e.status === 'LIVE');
  const scheduledEvents = events.filter((e: any) => e.status === 'SCHEDULED');
  const endedEvents = events.filter((e: any) => e.status === 'ENDED').slice(0, 5);

  // Pending claims across all my events
  const pendingClaims = await (prisma as any).liveClaim.findMany({
    where: { sellerUserId: userId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Active auctions (items with AUCTION_ACTIVE status in my events)
  const myEventIds = events.map((e: any) => e.id);
  const activeAuctions = myEventIds.length > 0 ? await (prisma as any).liveEventItem.findMany({
    where: { liveEventId: { in: myEventIds }, status: 'AUCTION_ACTIVE' },
    take: 10,
  }) : [];

  // Active breaks
  const activeBreaks = await (prisma as any).liveBreak.findMany({
    where: { sellerUserId: userId, status: { in: ['SETUP', 'SELLING_SPOTS', 'SOLD_OUT', 'RANDOMIZED', 'BREAKING'] } },
    include: { _count: { select: { spots: true, hits: true } } },
    take: 10,
  });

  // Sales needing seller action (from live events)
  const salesNeedingAction = await (prisma as any).sale.findMany({
    where: { sellerUserId: userId, status: { in: ['READY_TO_SHIP', 'DELIVERED', 'TRANSFER_PENDING'] } },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  return NextResponse.json({
    events: { live: liveEvents, scheduled: scheduledEvents, ended: endedEvents, total: events.length },
    pendingClaims,
    activeAuctions,
    activeBreaks,
    salesNeedingAction,
  });
}
