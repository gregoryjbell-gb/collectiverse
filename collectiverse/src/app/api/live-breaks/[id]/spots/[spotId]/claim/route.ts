import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function POST(_req: NextRequest, { params }: { params: { id: string; spotId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const buyerUserId = await ensureUserId(session);

  const liveBreak = await (prisma as any).liveBreak.findUnique({ where: { id: params.id } });
  if (!liveBreak) return NextResponse.json({ error: 'Break not found' }, { status: 404 });
  if (liveBreak.sellerUserId === buyerUserId) return NextResponse.json({ error: 'Cannot claim your own break spot' }, { status: 400 });
  if (!['SETUP', 'SELLING_SPOTS'].includes(liveBreak.status)) return NextResponse.json({ error: 'Break is not selling spots' }, { status: 400 });

  const spot = await (prisma as any).liveBreakSpot.findUnique({ where: { id: params.spotId } });
  if (!spot || spot.liveBreakId !== params.id) return NextResponse.json({ error: 'Spot not found' }, { status: 404 });
  if (spot.status !== 'AVAILABLE') return NextResponse.json({ error: 'Spot is not available' }, { status: 400 });

  await (prisma as any).liveBreakSpot.update({
    where: { id: params.spotId },
    data: { buyerUserId, status: 'SOLD' },
  });

  // Update filled spots count
  const filledCount = await (prisma as any).liveBreakSpot.count({ where: { liveBreakId: params.id, status: 'SOLD' } });
  const newStatus = filledCount >= liveBreak.totalSpots ? 'SOLD_OUT' : 'SELLING_SPOTS';
  await (prisma as any).liveBreak.update({ where: { id: params.id }, data: { filledSpots: filledCount, status: newStatus } });

  // Notify seller
  await createNotification({
    userId: liveBreak.sellerUserId,
    type: 'BREAK_SPOT_CLAIMED',
    title: 'Break Spot Claimed',
    message: `Spot #${spot.spotNumber} claimed in "${liveBreak.title}" (${filledCount}/${liveBreak.totalSpots})`,
    entityType: 'LIVE_EVENT',
    entityId: liveBreak.liveEventId,
  });

  // Chat message
  const buyer = await (prisma as any).user.findUnique({ where: { id: buyerUserId }, select: { displayName: true, username: true } });
  await (prisma as any).liveEventMessage.create({
    data: { liveEventId: liveBreak.liveEventId, userId: buyerUserId, messageType: 'SYSTEM', message: `🎟️ ${buyer?.displayName || buyer?.username || 'Buyer'} claimed Spot #${spot.spotNumber}` },
  });

  return NextResponse.json({ spot: { ...spot, buyerUserId, status: 'SOLD' }, filledSpots: filledCount });
}
