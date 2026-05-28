import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const listings = await (prisma as any).listing.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ listings });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const data = await req.json();
  const { inventoryItemId, inventoryGroupId, listingType, price, minimumOffer, allowOffers, allowTrades, description, shippingNotes, status } = data;

  if (!listingType || !['ITEM', 'GROUP'].includes(listingType)) {
    return NextResponse.json({ error: 'listingType must be ITEM or GROUP' }, { status: 400 });
  }

  // Verify ownership
  if (listingType === 'ITEM' && inventoryItemId) {
    const item = await prisma.inventoryItem.findFirst({ where: { id: inventoryItemId, userId } });
    if (!item) return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
  }
  if (listingType === 'GROUP' && inventoryGroupId) {
    const group = await (prisma as any).inventoryGroup.findFirst({ where: { id: inventoryGroupId, userId } });
    if (!group) return NextResponse.json({ error: 'Inventory group not found' }, { status: 404 });
  }

  const listing = await (prisma as any).listing.create({
    data: {
      userId,
      inventoryItemId: inventoryItemId || null,
      inventoryGroupId: inventoryGroupId || null,
      listingType,
      status: status || 'DRAFT',
      price: price ? parseFloat(price) : null,
      minimumOffer: minimumOffer ? parseFloat(minimumOffer) : null,
      allowOffers: allowOffers || false,
      allowTrades: allowTrades || false,
      description: description || null,
      shippingNotes: shippingNotes || null,
    },
  });

  return NextResponse.json({ listing }, { status: 201 });
}
