import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const buyerUserId = await ensureUserId(session);

  const listing = await (prisma as any).listing.findUnique({ where: { id: params.id } });
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  // Validations
  if (listing.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Listing is not available for purchase' }, { status: 400 });
  }
  if (!listing.buyNowEnabled) {
    return NextResponse.json({ error: 'Buy Now is not enabled for this listing' }, { status: 400 });
  }
  if (listing.userId === buyerUserId) {
    return NextResponse.json({ error: 'You cannot buy your own listing' }, { status: 400 });
  }
  if (!listing.price) {
    return NextResponse.json({ error: 'Listing has no price set' }, { status: 400 });
  }

  // Check item/group is still available
  if (listing.inventoryItemId) {
    const item = await (prisma as any).inventoryItem.findUnique({ where: { id: listing.inventoryItemId } });
    if (!item || item.status === 'SOLD') {
      return NextResponse.json({ error: 'Item is no longer available' }, { status: 400 });
    }
  }
  if (listing.inventoryGroupId) {
    const group = await (prisma as any).inventoryGroup.findUnique({ where: { id: listing.inventoryGroupId } });
    if (!group || group.status === 'SOLD') {
      return NextResponse.json({ error: 'Item is no longer available' }, { status: 400 });
    }
  }

  // Check no existing active sale for this listing by this buyer
  const existingSale = await (prisma as any).sale.findFirst({
    where: { listingId: listing.id, buyerUserId, status: { notIn: ['CANCELLED', 'COMPLETED'] } },
  });
  if (existingSale) {
    return NextResponse.json({ sale: existingSale });
  }

  const totalAmount = listing.price;

  // Create PaymentIntent
  const payment = await (prisma as any).paymentIntent.create({
    data: {
      buyerUserId,
      sellerUserId: listing.userId,
      listingId: listing.id,
      amount: totalAmount,
      status: 'PENDING',
    },
  });

  // Create Sale
  const sale = await (prisma as any).sale.create({
    data: {
      sellerUserId: listing.userId,
      buyerUserId,
      listingId: listing.id,
      inventoryItemId: listing.inventoryItemId,
      inventoryGroupId: listing.inventoryGroupId,
      purchaseType: 'BUY_NOW',
      status: 'PAYMENT_PENDING',
      salePrice: listing.price,
      totalAmount,
      paymentId: payment.id,
    },
  });

  // Reserve the listing
  await (prisma as any).listing.update({
    where: { id: listing.id },
    data: { status: 'RESERVED' },
  });

  // Notify seller
  await createNotification({
    userId: listing.userId,
    type: 'SALE_BUY_NOW',
    title: 'Buy Now Purchase',
    message: 'A buyer has purchased your listing via Buy Now. Awaiting payment.',
    entityType: 'SALE',
    entityId: sale.id,
  });

  // Notify buyer
  await createNotification({
    userId: buyerUserId,
    type: 'SALE_CREATED',
    title: 'Purchase Started',
    message: 'Your Buy Now purchase has been created. Please complete payment.',
    entityType: 'SALE',
    entityId: sale.id,
  });

  return NextResponse.json({ sale }, { status: 201 });
}
