import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const liveBreak = await (prisma as any).liveBreak.findUnique({
    where: { id: params.id },
    include: { spots: { orderBy: { spotNumber: 'asc' } }, hits: { orderBy: { createdAt: 'desc' } } },
  });
  if (!liveBreak) return NextResponse.json({ error: 'Break not found' }, { status: 404 });

  // Get buyer display names for spots
  const buyerIds = liveBreak.spots.filter((s: any) => s.buyerUserId).map((s: any) => s.buyerUserId);
  const buyers = buyerIds.length > 0 ? await (prisma as any).user.findMany({ where: { id: { in: buyerIds } }, select: { id: true, displayName: true, username: true } }) : [];
  const buyerMap: Record<string, string> = {};
  for (const b of buyers) { buyerMap[b.id] = b.displayName || b.username || 'User'; }

  return NextResponse.json({ break: liveBreak, buyerMap });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const liveBreak = await (prisma as any).liveBreak.findUnique({ where: { id: params.id } });
  if (!liveBreak || liveBreak.sellerUserId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const allowed = ['title', 'description', 'status', 'pricePerSpot'];
  const data: any = {};
  for (const key of allowed) { if (body[key] !== undefined) data[key] = body[key]; }

  const updated = await (prisma as any).liveBreak.update({ where: { id: params.id }, data });
  return NextResponse.json({ break: updated });
}
