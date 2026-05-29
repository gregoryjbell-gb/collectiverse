import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const sale = await (prisma as any).sale.findUnique({ where: { id: params.id } });
  if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
  if (sale.sellerUserId !== userId) return NextResponse.json({ error: 'Only seller can accept offer' }, { status: 403 });
  if (!sale.offerId) return NextResponse.json({ error: 'No offer to accept' }, { status: 400 });

  // Accept the offer
  const offer = await (prisma as any).offer.update({
    where: { id: sale.offerId },
    data: { status: 'ACCEPTED' },
  });

  // Create PaymentIntent
  const totalAmount = (sale.salePrice || offer.amount || 0) + (sale.shippingPrice || 0) + (sale.taxAmount || 0);
  const payment = await (prisma as any).paymentIntent.create({
    data: {
      buyerUserId: sale.buyerUserId,
      sellerUserId: sale.sellerUserId,
      listingId: sale.listingId,
      offerId: sale.offerId,
      amount: totalAmount,
      status: 'PENDING',
    },
  });

  // Create Shipment placeholder
  const shipment = await (prisma as any).shipment.create({
    data: {
      listingId: sale.listingId,
      offerId: sale.offerId,
      sellerUserId: sale.sellerUserId,
      buyerUserId: sale.buyerUserId,
      carrier: 'OTHER',
      shippingStatus: 'NOT_SHIPPED',
    },
  });

  // Create OwnershipTransfer placeholder
  const transfer = await (prisma as any).ownershipTransfer.create({
    data: {
      fromUserId: sale.sellerUserId,
      toUserId: sale.buyerUserId,
      inventoryItemId: sale.inventoryItemId,
      inventoryGroupId: sale.inventoryGroupId,
      listingId: sale.listingId,
      transferType: 'SALE',
      status: 'PENDING',
      transferPrice: sale.salePrice || offer.amount,
    },
  });

  // Update sale
  const updated = await (prisma as any).sale.update({
    where: { id: params.id },
    data: {
      status: 'PAYMENT_PENDING',
      totalAmount,
      paymentId: payment.id,
      shipmentId: shipment.id,
      transferId: transfer.id,
    },
  });

  // Notify buyer
  if (sale.buyerUserId) {
    await createNotification({
      userId: sale.buyerUserId,
      type: 'SALE_OFFER_ACCEPTED',
      title: 'Offer Accepted',
      message: 'Your offer has been accepted. Please complete payment.',
      entityType: 'SALE',
      entityId: sale.id,
    });
  }

  return NextResponse.json({ sale: updated, payment, shipment, transfer });
}
