import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const event = await (prisma as any).liveEvent.findUnique({ where: { id: params.id }, include: { items: true, claims: true } });
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  if (event.sellerUserId !== userId && session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Check if recap already exists
  const existing = await (prisma as any).liveEventRecap.findUnique({ where: { liveEventId: params.id } });
  if (existing) return NextResponse.json({ recap: existing });

  // Calculate stats
  const items = event.items || [];
  const claims = event.claims || [];
  const totalItemsPresented = items.filter((i: any) => i.status !== 'QUEUED' && i.status !== 'REMOVED').length;
  const totalItemsSold = items.filter((i: any) => i.status === 'SOLD' || i.status === 'CLAIMED').length;
  const totalClaims = claims.length;
  const totalAcceptedClaims = claims.filter((c: any) => c.status === 'ACCEPTED' || c.status === 'CONVERTED_TO_SALE').length;

  // Count bids
  const totalBids = await (prisma as any).liveBid.count({ where: { liveEventId: params.id } });

  // Calculate gross sales from converted claims and auction wins
  const convertedClaims = claims.filter((c: any) => c.status === 'CONVERTED_TO_SALE');
  const claimTotal = convertedClaims.reduce((sum: number, c: any) => sum + (c.claimAmount || 0), 0);
  const auctionSales = items.filter((i: any) => i.status === 'SOLD' && i.currentPrice).reduce((sum: number, i: any) => sum + (i.currentPrice || 0), 0);
  const grossSales = claimTotal + auctionSales;

  // Break spots
  const breaks = await (prisma as any).liveBreak.findMany({ where: { liveEventId: params.id } });
  const totalBreakSpotsSold = breaks.reduce((sum: number, b: any) => sum + (b.filledSpots || 0), 0);
  const breakRevenue = breaks.reduce((sum: number, b: any) => sum + ((b.pricePerSpot || 0) * (b.filledSpots || 0)), 0);
  const totalGross = grossSales + breakRevenue;

  const recap = await (prisma as any).liveEventRecap.create({
    data: {
      liveEventId: params.id,
      sellerUserId: event.sellerUserId,
      totalItemsPresented,
      totalItemsSold,
      totalClaims,
      totalAcceptedClaims,
      totalBids,
      grossSales: totalGross,
      totalBreakSpotsSold: totalBreakSpotsSold || null,
    },
  });

  return NextResponse.json({ recap }, { status: 201 });
}
