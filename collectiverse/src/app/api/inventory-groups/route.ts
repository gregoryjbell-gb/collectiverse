import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const groups = await (prisma as any).inventoryGroup.findMany({
    where: { userId },
    include: {
      cardSet: { select: { id: true, name: true, year: true, _count: { select: { cards: true } } } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ groups });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const data = await req.json();
  const { name, groupType, cardSetId, sealed, quantity, purchasePrice, estimatedValue, askingPrice, acquisitionDate, storageLocation, notes, description } = data;

  if (!name || !groupType) return NextResponse.json({ error: 'name and groupType are required' }, { status: 400 });

  const group = await (prisma as any).inventoryGroup.create({
    data: {
      userId,
      name,
      groupType,
      description: description || null,
      cardSetId: cardSetId || null,
      sealed: sealed || false,
      quantity: quantity ? parseInt(quantity) : 1,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
      askingPrice: askingPrice ? parseFloat(askingPrice) : null,
      acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
      storageLocation: storageLocation || null,
      notes: notes || null,
    },
  });

  return NextResponse.json({ group }, { status: 201 });
}
