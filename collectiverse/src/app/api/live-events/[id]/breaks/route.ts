import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const breaks = await (prisma as any).liveBreak.findMany({
    where: { liveEventId: params.id },
    include: { _count: { select: { spots: true, hits: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ breaks });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const event = await (prisma as any).liveEvent.findUnique({ where: { id: params.id } });
  if (!event || event.sellerUserId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { title, description, breakType, totalSpots, pricePerSpot, inventoryGroupId } = body;

  if (!title || !breakType || !totalSpots) {
    return NextResponse.json({ error: 'title, breakType, and totalSpots are required' }, { status: 400 });
  }

  const liveBreak = await (prisma as any).liveBreak.create({
    data: {
      liveEventId: params.id,
      sellerUserId: userId,
      inventoryGroupId: inventoryGroupId || null,
      title,
      description: description || null,
      breakType,
      totalSpots: parseInt(totalSpots),
      pricePerSpot: pricePerSpot ? parseFloat(pricePerSpot) : null,
    },
  });

  // Create spots
  for (let i = 1; i <= parseInt(totalSpots); i++) {
    await (prisma as any).liveBreakSpot.create({
      data: { liveBreakId: liveBreak.id, spotNumber: i, price: pricePerSpot ? parseFloat(pricePerSpot) : null },
    });
  }

  return NextResponse.json({ break: liveBreak }, { status: 201 });
}
