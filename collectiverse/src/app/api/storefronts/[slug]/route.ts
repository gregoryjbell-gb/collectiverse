import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const storefront = await (prisma as any).storefront.findUnique({ where: { slug: params.slug } });
  if (!storefront || storefront.status !== 'ACTIVE') return NextResponse.json({ error: 'Storefront not found' }, { status: 404 });

  const listings = await (prisma as any).listing.findMany({ where: { userId: storefront.userId, status: 'ACTIVE' }, take: 20, orderBy: { createdAt: 'desc' } });
  const liveEvents = await (prisma as any).liveEvent.findMany({ where: { sellerUserId: storefront.userId, status: { in: ['SCHEDULED', 'LIVE'] } }, take: 5 });
  const reputation = await (prisma as any).userReputation.findUnique({ where: { userId: storefront.userId } });

  return NextResponse.json({ storefront, listings, liveEvents, reputation });
}
