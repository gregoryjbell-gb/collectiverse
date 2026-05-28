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

  const where: any = {};
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

  const snapshots = await (prisma as any).marketValueSnapshot.findMany({
    where,
    orderBy: { capturedAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ snapshots });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const data = await req.json();
  const { inventoryItemId, inventoryGroupId, cardId, source, value, gradeCompany, gradeValue, metadata } = data;

  if (!value || isNaN(parseFloat(value))) return NextResponse.json({ error: 'value is required' }, { status: 400 });

  // Verify ownership if item/group
  if (inventoryItemId) {
    const item = await prisma.inventoryItem.findFirst({ where: { id: inventoryItemId, userId } });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    // Update estimatedValue on the item
    await prisma.inventoryItem.update({ where: { id: inventoryItemId }, data: { estimatedValue: parseFloat(value) } });
  }
  if (inventoryGroupId) {
    const group = await (prisma as any).inventoryGroup.findFirst({ where: { id: inventoryGroupId, userId } });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    await (prisma as any).inventoryGroup.update({ where: { id: inventoryGroupId }, data: { estimatedValue: parseFloat(value) } });
  }

  const snapshot = await (prisma as any).marketValueSnapshot.create({
    data: {
      cardId: cardId || null,
      inventoryItemId: inventoryItemId || null,
      inventoryGroupId: inventoryGroupId || null,
      source: source || 'MANUAL',
      value: parseFloat(value),
      gradeCompany: gradeCompany || null,
      gradeValue: gradeValue || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  return NextResponse.json({ snapshot }, { status: 201 });
}
