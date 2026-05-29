import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function POST(_req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const event = await (prisma as any).liveEvent.findUnique({ where: { id: params.id } });
  if (!event || event.sellerUserId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const item = await (prisma as any).liveEventItem.findUnique({ where: { id: params.itemId } });
  if (!item || item.status !== 'AUCTION_ACTIVE') return NextResponse.json({ error: 'Auction is not active' }, { status: 400 });

  // Check if there's a winning bid
  if (!item.winningBidId || !item.winningUserId) {
    // No bids — mark as passed
    await (prisma as any).liveEventItem.update({ where: { id: params.itemId }, data: { status: 'PASSED' } });
    await (prisma as any).liveEventMessage.create({
      data: { liveEventId: params.id, messageType: 'SYSTEM', message: `🔨 Auction ended: "${item.title}" — No bids` },
    });
    return NextResponse.json({ result: 'NO_BIDS', item });
  }

  // Check reserve price
  const currentPrice = item.currentPrice || 0;
  if (item.reservePrice && currentPrice < item.reservePrice) {
    await (prisma as any).liveEventItem.update({ where: { id: params.itemId }, data: { status: 'PASSED' } });
    await (prisma as any).liveEventMessage.create({
      data: { liveEventId: params.id, messageType: 'SYSTEM', message: `🔨 Auction ended: "${item.title}" — Reserve not met` },
    });
    return NextResponse.json({ result: 'RESERVE_NOT_MET', item });
  }

  // Mark winning bid as WON
  await (prisma as any).liveBid.update({ where: { id: item.winningBidId }, data: { status: 'WON' } });

  // Create Sale
  const sale = await (prisma as any).sale.create({
    data: {
      sellerUserId: event.sellerUserId,
      buyerUserId: item.winningUserId,
      inventoryItemId: item.inventoryItemId,
      inventoryGroupId: item.inventoryGroupId,
      listingId: item.listingId,
      purchaseType: 'BUY_NOW', // Could add AUCTION type
      status: 'PAYMENT_PENDING',
      salePrice: currentPrice,
      totalAmount: currentPrice,
    },
  });

  // Create PaymentIntent
  const payment = await (prisma as any).paymentIntent.create({
    data: {
      buyerUserId: item.winningUserId,
      sellerUserId: event.sellerUserId,
      amount: currentPrice,
      status: 'PENDING',
    },
  });

  await (prisma as any).sale.update({ where: { id: sale.id }, data: { paymentId: payment.id } });

  // Update item
  await (prisma as any).liveEventItem.update({ where: { id: params.itemId }, data: { status: 'SOLD' } });

  // Notifications
  await createNotification({
    userId: item.winningUserId,
    type: 'AUCTION_WON',
    title: 'Auction Won!',
    message: `You won "${item.title}" for $${currentPrice.toFixed(2)}. Please complete payment.`,
    entityType: 'SALE',
    entityId: sale.id,
  });

  await createNotification({
    userId: event.sellerUserId,
    type: 'AUCTION_ENDED',
    title: 'Auction Sold',
    message: `"${item.title}" sold for $${currentPrice.toFixed(2)}.`,
    entityType: 'SALE',
    entityId: sale.id,
  });

  // System message
  await (prisma as any).liveEventMessage.create({
    data: { liveEventId: params.id, messageType: 'SYSTEM', message: `🔨 SOLD! "${item.title}" — $${currentPrice.toFixed(2)}` },
  });

  return NextResponse.json({ result: 'SOLD', sale, winningBid: { amount: currentPrice, userId: item.winningUserId } });
}
