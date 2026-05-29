import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

async function checkModerator(eventId: string, session: any, userId: string) {
  if (session.role === 'ADMIN') return true;
  const event = await (prisma as any).liveEvent.findUnique({ where: { id: eventId } });
  return event?.sellerUserId === userId;
}

// POST /api/live-events/[id]/moderation — generic action handler
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  if (!(await checkModerator(params.id, session, userId))) {
    return NextResponse.json({ error: 'Only seller or admin can moderate' }, { status: 403 });
  }

  const body = await req.json();
  const { action, targetUserId, reason, duration } = body;

  if (!action || !targetUserId) return NextResponse.json({ error: 'action and targetUserId required' }, { status: 400 });

  let actionType = '';
  let userStatus = '';
  let mutedUntil: Date | null = null;

  switch (action) {
    case 'warn':
      actionType = 'WARNING_ISSUED';
      userStatus = 'WARNED';
      break;
    case 'mute':
      actionType = 'USER_MUTED';
      userStatus = 'MUTED';
      mutedUntil = new Date(Date.now() + (duration || 300) * 1000); // default 5 min
      break;
    case 'unmute':
      actionType = 'USER_UNMUTED';
      userStatus = 'ACTIVE';
      break;
    case 'ban':
      actionType = 'USER_BANNED';
      userStatus = 'BANNED';
      break;
    case 'unban':
      actionType = 'USER_UNBANNED';
      userStatus = 'ACTIVE';
      break;
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // Record moderation action
  await (prisma as any).liveEventModerationAction.create({
    data: { liveEventId: params.id, moderatorUserId: userId, targetUserId, actionType, reason: reason || null },
  });

  // Update user status
  await (prisma as any).liveEventUserStatus.upsert({
    where: { liveEventId_userId: { liveEventId: params.id, userId: targetUserId } },
    update: { status: userStatus, mutedUntil, banReason: action === 'ban' ? reason : undefined },
    create: { liveEventId: params.id, userId: targetUserId, status: userStatus, mutedUntil, banReason: action === 'ban' ? reason : null },
  });

  // Notify target user
  const actionLabels: Record<string, string> = { warn: 'warned', mute: 'muted', ban: 'banned', unmute: 'unmuted', unban: 'unbanned' };
  await createNotification({
    userId: targetUserId,
    type: 'LIVE_MODERATION',
    title: `You have been ${actionLabels[action] || action}`,
    message: reason || `A moderator has ${actionLabels[action]} you in a live event.`,
    entityType: 'LIVE_EVENT',
    entityId: params.id,
  });

  return NextResponse.json({ success: true, actionType, userStatus });
}
