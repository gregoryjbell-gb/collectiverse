import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function POST(_req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const buyerUserId = await ensureUserId(session);

  const event = await (prisma as any).liveEvent.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  if (event.sellerUserId === buyerUserId) return NextResponse.json({ error: 'Cannot claim your own item' }, { status: 400 });
  if (event.status !== 'LIVE') return NextResponse.json({ error: 'Event is not live' }, { status: 400 });

  const item = await (prisma as any).liveEventItem.findUnique({ where: { id: params.itemId } });
  if (!item || item.liveEventId !== params.id) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  if (item.status !== 'PRESENTING') return NextResponse.json({ error: 'Item is not currently being presented' }, { status: 400 });

  // Check no pending claim exists
  const existingClaim = await (prisma as any).liveClaim.findFirst({
    where: { liveEventItemId: params.itemId, status: 'PENDING' },
  });
  if (existingClaim) return NextResponse.json({ error: 'Item already has a pending claim' }, { status: 400 });

  const claim = await (prisma as any).liveClaim.create({
    data: {
      liveEventId: params.id,
      liveEventItemId: params.itemId,
      buyerUserId,
      sellerUserId: event.sellerUserId,
      claimAmount: item.claimPrice || item.currentPrice || 0,
    },
  });

  // Mark item as claimed
  await (prisma as any).liveEventItem.update({ where: { id: params.itemId }, data: { status: 'CLAIMED' } });

  // Notify seller
  await createNotification({
    userId: event.sellerUserId,
    type: 'LIVE_CLAIM',
    title: 'Item Claimed',
    message: `A buyer claimed "${item.title}" during your live event.`,
    entityType: 'LIVE_EVENT',
    entityId: event.id,
  });

  return NextResponse.json({ claim }, { status: 201 });
}
