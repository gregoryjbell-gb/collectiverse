import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const inventoryItemId = req.nextUrl.searchParams.get('inventoryItemId');
  const inventoryGroupId = req.nextUrl.searchParams.get('inventoryGroupId');
  const cardId = req.nextUrl.searchParams.get('cardId');
  const days = parseInt(req.nextUrl.searchParams.get('days') || '365');

  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: any = { capturedAt: { gte: since } };

  if (inventoryItemId) {
    const item = await prisma.inventoryItem.findFirst({ where: { id: inventoryItemId, userId } });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    where.inventoryItemId = inventoryItemId;
  } else if (inventoryGroupId) {
    const group = await (prisma as any).inventoryGroup.findFirst({ where: { id: inventoryGroupId, userId } });
    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    where.inventoryGroupId = inventoryGroupId;
  } else if (cardId) {
    where.cardId = cardId;
  } else {
    return NextResponse.json({ error: 'Provide inventoryItemId, inventoryGroupId, or cardId' }, { status: 400 });
  }

  const history = await (prisma as any).marketValueSnapshot.findMany({
    where,
    orderBy: { capturedAt: 'asc' },
    select: { value: true, source: true, capturedAt: true },
  });

  // Calculate trend
  let trend = 'unchanged';
  if (history.length >= 2) {
    const latest = history[history.length - 1].value;
    const previous = history[history.length - 2].value;
    if (latest > previous) trend = 'up';
    else if (latest < previous) trend = 'down';
  }

  return NextResponse.json({ history, trend, count: history.length });
}
