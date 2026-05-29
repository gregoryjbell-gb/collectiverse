import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const event = await (prisma as any).liveEvent.findUnique({ where: { id: params.id } });
  if (!event || event.sellerUserId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { inventoryItemId, inventoryGroupId, listingId, title, description, startingPrice, claimPrice } = body;

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const itemCount = await (prisma as any).liveEventItem.count({ where: { liveEventId: params.id } });

  const item = await (prisma as any).liveEventItem.create({
    data: {
      liveEventId: params.id,
      inventoryItemId: inventoryItemId || null,
      inventoryGroupId: inventoryGroupId || null,
      listingId: listingId || null,
      title,
      description: description || null,
      startingPrice: startingPrice ? parseFloat(startingPrice) : null,
      claimPrice: claimPrice ? parseFloat(claimPrice) : null,
      currentPrice: claimPrice ? parseFloat(claimPrice) : (startingPrice ? parseFloat(startingPrice) : null),
      displayOrder: itemCount + 1,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
