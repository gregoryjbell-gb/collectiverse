import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const { listingId } = body;

  if (!listingId) {
    return NextResponse.json({ error: 'listingId is required' }, { status: 400 });
  }

  const listing = await (prisma as any).listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  if (listing.userId !== userId) return NextResponse.json({ error: 'Not your listing' }, { status: 403 });

  // Check if sale already exists for this listing
  const existing = await (prisma as any).sale.findFirst({ where: { listingId } });
  if (existing) return NextResponse.json({ sale: existing });

  const sale = await (prisma as any).sale.create({
    data: {
      sellerUserId: userId,
      listingId: listing.id,
      inventoryItemId: listing.inventoryItemId || null,
      inventoryGroupId: listing.inventoryGroupId || null,
      status: listing.status === 'ACTIVE' ? 'LISTED' : 'DRAFT',
      salePrice: listing.price,
    },
  });

  return NextResponse.json({ sale }, { status: 201 });
}
