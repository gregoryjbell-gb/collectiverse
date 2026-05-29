import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role'); // 'buyer' | 'seller' | null (both)

  const where: any = {};
  if (role === 'buyer') {
    where.buyerUserId = userId;
  } else if (role === 'seller') {
    where.sellerUserId = userId;
  } else {
    where.OR = [{ sellerUserId: userId }, { buyerUserId: userId }];
  }

  const sales = await (prisma as any).sale.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ sales });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const { inventoryItemId, inventoryGroupId, listingId } = body;

  if (!inventoryItemId && !inventoryGroupId && !listingId) {
    return NextResponse.json({ error: 'inventoryItemId, inventoryGroupId, or listingId is required' }, { status: 400 });
  }

  let listing = null;
  let itemId = inventoryItemId || null;
  let groupId = inventoryGroupId || null;
  let salePrice: number | null = null;

  // If from listing, validate ownership
  if (listingId) {
    listing = await (prisma as any).listing.findUnique({ where: { id: listingId } });
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    if (listing.userId !== userId) return NextResponse.json({ error: 'Not your listing' }, { status: 403 });
    itemId = listing.inventoryItemId || itemId;
    groupId = listing.inventoryGroupId || groupId;
    salePrice = listing.price;

    // Check if sale already exists for this listing
    const existing = await (prisma as any).sale.findFirst({ where: { listingId } });
    if (existing) return NextResponse.json({ sale: existing });
  }

  // If from inventory item, validate ownership
  if (itemId && !listingId) {
    const item = await (prisma as any).inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    if (item.userId !== userId) return NextResponse.json({ error: 'Not your item' }, { status: 403 });
    salePrice = item.askingPrice || item.estimatedValue;

    // Check if sale already exists for this item
    const existing = await (prisma as any).sale.findFirst({ where: { inventoryItemId: itemId, status: { notIn: ['CANCELLED', 'COMPLETED'] } } });
    if (existing) return NextResponse.json({ sale: existing });

    // Check if listing exists, create one if not
    const existingListing = await (prisma as any).listing.findFirst({ where: { inventoryItemId: itemId, status: { in: ['DRAFT', 'ACTIVE'] } } });
    if (existingListing) {
      listing = existingListing;
    } else {
      listing = await (prisma as any).listing.create({
        data: {
          userId,
          inventoryItemId: itemId,
          listingType: 'ITEM',
          status: 'ACTIVE',
          price: salePrice,
          allowOffers: true,
        },
      });
    }

    // Mark item as FOR_SALE
    await (prisma as any).inventoryItem.update({ where: { id: itemId }, data: { status: 'FOR_SALE' } });
  }

  // If from inventory group, validate ownership
  if (groupId && !listingId && !itemId) {
    const group = await (prisma as any).inventoryGroup.findUnique({ where: { id: groupId } });
    if (!group) return NextResponse.json({ error: 'Inventory group not found' }, { status: 404 });
    if (group.userId !== userId) return NextResponse.json({ error: 'Not your group' }, { status: 403 });
    salePrice = group.askingPrice || group.estimatedValue;

    // Check if sale already exists for this group
    const existing = await (prisma as any).sale.findFirst({ where: { inventoryGroupId: groupId, status: { notIn: ['CANCELLED', 'COMPLETED'] } } });
    if (existing) return NextResponse.json({ sale: existing });

    // Check if listing exists, create one if not
    const existingListing = await (prisma as any).listing.findFirst({ where: { inventoryGroupId: groupId, status: { in: ['DRAFT', 'ACTIVE'] } } });
    if (existingListing) {
      listing = existingListing;
    } else {
      listing = await (prisma as any).listing.create({
        data: {
          userId,
          inventoryGroupId: groupId,
          listingType: 'GROUP',
          status: 'ACTIVE',
          price: salePrice,
          allowOffers: true,
        },
      });
    }

    // Mark group as FOR_SALE
    await (prisma as any).inventoryGroup.update({ where: { id: groupId }, data: { status: 'FOR_SALE' } });
  }

  const sale = await (prisma as any).sale.create({
    data: {
      sellerUserId: userId,
      listingId: listing?.id || null,
      inventoryItemId: itemId,
      inventoryGroupId: groupId,
      status: 'LISTED',
      salePrice,
    },
  });

  return NextResponse.json({ sale }, { status: 201 });
}
