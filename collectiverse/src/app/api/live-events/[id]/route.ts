import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const event = await (prisma as any).liveEvent.findUnique({
    where: { id: params.id },
    include: { items: { orderBy: { displayOrder: 'asc' }, include: { claims: true } }, claims: { orderBy: { createdAt: 'desc' } } },
  });
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const seller = await (prisma as any).user.findUnique({ where: { id: event.sellerUserId }, select: { username: true, displayName: true } });

  return NextResponse.json({ event, seller: seller?.displayName || seller?.username || 'Seller' });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const event = await (prisma as any).liveEvent.findUnique({ where: { id: params.id } });
  if (!event || event.sellerUserId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const allowed = ['title', 'description', 'eventType', 'scheduledStartAt', 'streamUrl', 'chatEnabled'];
  const data: any = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = key === 'scheduledStartAt' && body[key] ? new Date(body[key]) : body[key];
  }

  const updated = await (prisma as any).liveEvent.update({ where: { id: params.id }, data });
  return NextResponse.json({ event: updated });
}
