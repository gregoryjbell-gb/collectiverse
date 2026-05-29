import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const claim = await (prisma as any).liveClaim.findUnique({ where: { id: params.id } });
  if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });

  // Seller or admin can cancel
  if (claim.sellerUserId !== userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only seller or admin can cancel claims' }, { status: 403 });
  }

  await (prisma as any).liveClaim.update({ where: { id: params.id }, data: { status: 'CANCELLED' } });

  // Reset item to presenting
  await (prisma as any).liveEventItem.update({ where: { id: claim.liveEventItemId }, data: { status: 'PRESENTING' } });

  // Log moderation action
  await (prisma as any).liveEventModerationAction.create({
    data: { liveEventId: claim.liveEventId, moderatorUserId: userId, targetUserId: claim.buyerUserId, actionType: 'CLAIM_CANCELLED', reason: null },
  });

  // System message
  await (prisma as any).liveEventMessage.create({
    data: { liveEventId: claim.liveEventId, messageType: 'SYSTEM', message: 'Claim cancelled by moderator. Item is available again.' },
  });

  return NextResponse.json({ success: true });
}
