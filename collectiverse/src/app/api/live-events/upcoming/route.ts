import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const eventType = searchParams.get('eventType');

  const where: any = { status: 'SCHEDULED', visibility: 'PUBLIC' };
  if (category) where.category = category;
  if (eventType) where.eventType = eventType;

  const events = await (prisma as any).liveEvent.findMany({
    where,
    orderBy: [{ featured: 'desc' }, { scheduledStartAt: 'asc' }],
    take: 50,
  });

  const enriched = [];
  for (const event of events) {
    const seller = await (prisma as any).user.findUnique({ where: { id: event.sellerUserId }, select: { username: true, displayName: true } });
    enriched.push({ ...event, seller: seller?.displayName || seller?.username || 'Seller' });
  }

  return NextResponse.json({ events: enriched });
}
