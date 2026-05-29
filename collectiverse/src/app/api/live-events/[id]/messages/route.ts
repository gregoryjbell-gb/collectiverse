import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const after = searchParams.get('after'); // ISO timestamp for polling
  const limit = parseInt(searchParams.get('limit') || '50');

  const where: any = { liveEventId: params.id, deleted: false };
  if (after) where.createdAt = { gt: new Date(after) };

  const messages = await (prisma as any).liveEventMessage.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  // Enrich with user display names
  const userIds = Array.from(new Set(messages.filter((m: any) => m.userId).map((m: any) => m.userId)));
  const users = userIds.length > 0
    ? await (prisma as any).user.findMany({ where: { id: { in: userIds } }, select: { id: true, displayName: true, username: true } })
    : [];
  const userMap: Record<string, string> = {};
  for (const u of users) { userMap[u.id] = u.displayName || u.username || 'User'; }

  const enriched = messages.map((m: any) => ({
    ...m,
    displayName: m.userId ? (userMap[m.userId] || 'User') : 'System',
  }));

  return NextResponse.json({ messages: enriched });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const event = await (prisma as any).liveEvent.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  if (!event.chatEnabled) return NextResponse.json({ error: 'Chat is disabled' }, { status: 400 });

  // Check if user is muted or banned
  const userStatus = await (prisma as any).liveEventUserStatus.findUnique({
    where: { liveEventId_userId: { liveEventId: params.id, userId } },
  });
  if (userStatus?.status === 'BANNED') return NextResponse.json({ error: 'You are banned from this event' }, { status: 403 });
  if (userStatus?.status === 'MUTED') {
    if (!userStatus.mutedUntil || new Date() < new Date(userStatus.mutedUntil)) {
      return NextResponse.json({ error: 'You are muted' }, { status: 403 });
    }
  }

  const body = await req.json();
  const { message } = body;
  if (!message || !message.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

  // Determine message type
  const isSeller = event.sellerUserId === userId;
  const messageType = isSeller ? 'SELLER_UPDATE' : 'CHAT';

  const msg = await (prisma as any).liveEventMessage.create({
    data: {
      liveEventId: params.id,
      userId,
      messageType,
      message: message.trim().slice(0, 500),
    },
  });

  const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { displayName: true, username: true } });

  return NextResponse.json({ message: { ...msg, displayName: user?.displayName || user?.username || 'User' } }, { status: 201 });
}
