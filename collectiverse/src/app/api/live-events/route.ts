import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const eventType = searchParams.get('eventType');

  const where: any = {};
  if (status) where.status = status;
  else where.status = { in: ['SCHEDULED', 'LIVE', 'PAUSED'] };
  if (eventType) where.eventType = eventType;

  const events = await (prisma as any).liveEvent.findMany({
    where,
    orderBy: [{ status: 'asc' }, { scheduledStartAt: 'asc' }, { createdAt: 'desc' }],
    include: { _count: { select: { items: true, claims: true } } },
    take: 50,
  });

  // Get seller info
  const enriched = [];
  for (const event of events) {
    const seller = await (prisma as any).user.findUnique({ where: { id: event.sellerUserId }, select: { username: true, displayName: true } });
    enriched.push({ ...event, seller: seller?.displayName || seller?.username || 'Seller' });
  }

  return NextResponse.json({ events: enriched });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const { title, description, eventType, scheduledStartAt, streamUrl, chatEnabled } = body;

  if (!title || !eventType) return NextResponse.json({ error: 'title and eventType are required' }, { status: 400 });

  const event = await (prisma as any).liveEvent.create({
    data: {
      sellerUserId: userId,
      title,
      description: description || null,
      eventType,
      scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt) : null,
      streamUrl: streamUrl || null,
      chatEnabled: chatEnabled !== false,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}
