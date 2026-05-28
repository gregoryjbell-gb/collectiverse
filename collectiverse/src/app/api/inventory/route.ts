import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mkdir } from 'fs/promises';
import { join } from 'path';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const url = req.nextUrl;
  const status = url.searchParams.get('status');
  const condition = url.searchParams.get('condition');
  const search = url.searchParams.get('q');
  const sport = url.searchParams.get('sport');
  const year = url.searchParams.get('year');
  const setId = url.searchParams.get('setId');
  const manufacturer = url.searchParams.get('manufacturer');
  const teamId = url.searchParams.get('teamId');
  const gradeCompany = url.searchParams.get('gradeCompany');
  const storageLocation = url.searchParams.get('storageLocation');
  const minValue = url.searchParams.get('minValue');
  const maxValue = url.searchParams.get('maxValue');
  const sort = url.searchParams.get('sort') || 'createdAt';
  const order = url.searchParams.get('order') || 'desc';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (status) where.status = status;
  if (condition) where.condition = condition;
  if (gradeCompany) where.gradeCompany = gradeCompany;
  if (storageLocation) where.storageLocation = { contains: storageLocation, mode: 'insensitive' };
  if (minValue) where.estimatedValue = { ...(where.estimatedValue || {}), gte: parseFloat(minValue) };
  if (maxValue) where.estimatedValue = { ...(where.estimatedValue || {}), lte: parseFloat(maxValue) };

  // Card-level filters
  const cardWhere: any = {};
  if (search) {
    cardWhere.OR = [
      { person: { displayName: { contains: search, mode: 'insensitive' } } },
      { set: { name: { contains: search, mode: 'insensitive' } } },
      { cardNumber: { contains: search } },
      { team: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (sport) cardWhere.set = { ...(cardWhere.set || {}), sport: { name: { equals: sport, mode: 'insensitive' } } };
  if (year) cardWhere.year = parseInt(year);
  if (setId) cardWhere.setId = setId;
  if (manufacturer) cardWhere.set = { ...(cardWhere.set || {}), manufacturer: { contains: manufacturer, mode: 'insensitive' } };
  if (teamId) cardWhere.teamId = teamId;

  if (Object.keys(cardWhere).length > 0) where.card = cardWhere;

  const orderBy: any = {};
  const allowedSorts = ['createdAt', 'estimatedValue', 'purchasePrice', 'status', 'quantity'];
  orderBy[allowedSorts.includes(sort) ? sort : 'createdAt'] = order === 'asc' ? 'asc' : 'desc';

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        card: {
          include: {
            person: { select: { id: true, displayName: true } },
            team: { select: { id: true, name: true } },
            set: { select: { id: true, name: true, year: true, manufacturer: true, sportId: true, sport: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return NextResponse.json({
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const data = await req.json();
  const { cardId, quantity, condition, gradeCompany, gradeValue, certNumber, acquisitionDate, purchasePrice, estimatedValue, askingPrice, status, storageLocation, notes } = data;

  if (!cardId) return NextResponse.json({ error: 'cardId is required' }, { status: 400 });

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  // Validate status
  const validStatuses = ['OWNED', 'FOR_SALE', 'SOLD', 'TRADE_ONLY', 'WATCHLIST'];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
  }

  // Validate condition
  const validConditions = ['RAW', 'PSA', 'BGS', 'SGC', 'CGC'];
  if (condition && !validConditions.includes(condition)) {
    return NextResponse.json({ error: `Invalid condition. Must be one of: ${validConditions.join(', ')}` }, { status: 400 });
  }

  const item = await prisma.inventoryItem.create({
    data: {
      userId,
      cardId,
      quantity: quantity ? parseInt(quantity) : 1,
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
    include: { card: { include: { person: true, set: true, team: true } } },
  });

  // Create user-specific inventory item folder
  const itemDir = join(process.cwd(), 'public', 'uploads', 'users', userId, 'inventory', item.id);
  await mkdir(itemDir, { recursive: true }).catch(() => {});

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
