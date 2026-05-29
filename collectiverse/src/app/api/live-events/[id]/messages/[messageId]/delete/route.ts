import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { id: string; messageId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  // Check if seller or admin
  const event = await (prisma as any).liveEvent.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  if (event.sellerUserId !== userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only seller or admin can delete messages' }, { status: 403 });
  }

  const message = await (prisma as any).liveEventMessage.findUnique({ where: { id: params.messageId } });
  if (!message || message.liveEventId !== params.id) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

  await (prisma as any).liveEventMessage.update({
    where: { id: params.messageId },
    data: { deleted: true, deletedByUserId: userId, deletedAt: new Date() },
  });

  // Log moderation action if deleting another user's message
  if (message.userId && message.userId !== userId) {
    await (prisma as any).liveEventModerationAction.create({
      data: { liveEventId: params.id, moderatorUserId: userId, targetUserId: message.userId, actionType: 'MESSAGE_DELETED', reason: null },
    });
  }

  return NextResponse.json({ success: true });
}
