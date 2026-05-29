import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const event = await (prisma as any).liveEvent.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  if (!event.scheduledStartAt) return NextResponse.json({ error: 'Event has no scheduled start time' }, { status: 400 });

  // Check if already has reminder
  const existing = await (prisma as any).liveEventReminder.findFirst({
    where: { liveEventId: params.id, userId, status: 'ACTIVE' },
  });
  if (existing) return NextResponse.json({ reminder: existing, message: 'Already set' });

  // Set reminder 15 minutes before
  const remindAt = new Date(new Date(event.scheduledStartAt).getTime() - 15 * 60 * 1000);

  const reminder = await (prisma as any).liveEventReminder.create({
    data: { liveEventId: params.id, userId, reminderType: 'IN_APP', remindAt },
  });

  // Increment reminder count
  await (prisma as any).liveEvent.update({ where: { id: params.id }, data: { reminderCount: { increment: 1 } } });

  return NextResponse.json({ reminder }, { status: 201 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  await (prisma as any).liveEventReminder.updateMany({
    where: { liveEventId: params.id, userId, status: 'ACTIVE' },
    data: { status: 'CANCELLED' },
  });

  await (prisma as any).liveEvent.update({ where: { id: params.id }, data: { reminderCount: { decrement: 1 } } }).catch(() => {});

  return NextResponse.json({ success: true });
}
