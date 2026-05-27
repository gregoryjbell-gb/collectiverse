import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = req.nextUrl;
  const status = url.searchParams.get('status');
  const condition = url.searchParams.get('condition');
  const search = url.searchParams.get('q');
  const sort = url.searchParams.get('sort') || 'createdAt';
  const order = url.searchParams.get('order') || 'desc';

  const where: any = { userId: session.sub };
  if (status) where.status = status;
  if (condition) where.condition = condition;
  if (search) {
    where.card = {
      OR: [
        { person: { displayName: { contains: search, mode: 'insensitive' } } },
        { set: { name: { contains: search, mode: 'insensitive' } } },
        { cardNumber: { contains: search } },
      ],
    };
  }

  const orderBy: any = {};
  const allowedSorts = ['createdAt', 'estimatedValue', 'purchasePrice', 'status'];
  orderBy[allowedSorts.includes(sort) ? sort : 'createdAt'] = order === 'asc' ? 'asc' : 'desc';

  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy,
    include: {
      card: {
        include: {
          person: { select: { id: true, displayName: true } },
          team: { select: { id: true, name: true } },
          set: { select: { id: true, name: true, year: true, manufacturer: true } },
        },
      },
    },
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const { cardId, quantity, condition, gradeCompany, gradeValue, certNumber, acquisitionDate, purchasePrice, estimatedValue, askingPrice, status, storageLocation, notes } = data;

  if (!cardId) {
    return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
  }

  // Verify card exists
  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const item = await prisma.inventoryItem.create({
    data: {
      userId: session.sub,
      cardId,
      quantity: quantity || 1,
      condition: condition || null,
      gradeCompany: gradeCompany || null,
      gradeValue: gradeValue || null,
      certNumber: certNumber || null,
      acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
      estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
      askingPrice: askingPrice ? parseFloat(askingPrice) : null,
      status: status || 'OWNED',
      storageLocation: storageLocation || null,
      notes: notes || null,
    },
    include: {
      card: { include: { person: true, set: true, team: true } },
    },
  });

  // Create purchase transaction if price provided
  if (purchasePrice) {
    await prisma.inventoryTransaction.create({
      data: {
        inventoryItemId: item.id,
        type: 'PURCHASE',
        amount: parseFloat(purchasePrice),
        transactionDate: acquisitionDate ? new Date(acquisitionDate) : new Date(),
      },
    });
  }

  return NextResponse.json({ item }, { status: 201 });
}
