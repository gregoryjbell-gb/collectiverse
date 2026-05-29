import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const event = await (prisma as any).liveEvent.findUnique({ where: { id: params.id } });
  if (!event || event.sellerUserId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const allowed = ['title', 'description', 'startingPrice', 'claimPrice', 'currentPrice', 'status', 'displayOrder'];
  const data: any = {};
  for (const key of allowed) { if (body[key] !== undefined) data[key] = body[key]; }

  const item = await (prisma as any).liveEventItem.update({ where: { id: params.itemId }, data });
  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const event = await (prisma as any).liveEvent.findUnique({ where: { id: params.id } });
  if (!event || event.sellerUserId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await (prisma as any).liveEventItem.delete({ where: { id: params.itemId } });
  return NextResponse.json({ success: true });
}
