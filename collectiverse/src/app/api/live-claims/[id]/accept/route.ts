import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const claim = await (prisma as any).liveClaim.findUnique({ where: { id: params.id } });
  if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  if (claim.sellerUserId !== userId) return NextResponse.json({ error: 'Only seller can accept' }, { status: 403 });
  if (claim.status !== 'PENDING') return NextResponse.json({ error: 'Claim is not pending' }, { status: 400 });

  // Get the item
  const item = await (prisma as any).liveEventItem.findUnique({ where: { id: claim.liveEventItemId } });

  // Create Sale from claim
  const sale = await (prisma as any).sale.create({
    data: {
      sellerUserId: claim.sellerUserId,
      buyerUserId: claim.buyerUserId,
      inventoryItemId: item?.inventoryItemId || null,
      inventoryGroupId: item?.inventoryGroupId || null,
      listingId: item?.listingId || null,
      purchaseType: 'BUY_NOW',
      status: 'PAYMENT_PENDING',
      salePrice: claim.claimAmount,
      totalAmount: claim.claimAmount,
    },
  });

  // Update claim
  await (prisma as any).liveClaim.update({
    where: { id: params.id },
    data: { status: 'CONVERTED_TO_SALE', saleId: sale.id },
  });

  // Mark item as sold
  await (prisma as any).liveEventItem.update({ where: { id: claim.liveEventItemId }, data: { status: 'SOLD' } });

  // Notify buyer
  await createNotification({
    userId: claim.buyerUserId,
    type: 'LIVE_CLAIM_ACCEPTED',
    title: 'Claim Accepted',
    message: `Your claim has been accepted! Please complete payment.`,
    entityType: 'SALE',
    entityId: sale.id,
  });

  // System message
  await (prisma as any).liveEventMessage.create({
    data: { liveEventId: claim.liveEventId, messageType: 'SYSTEM', message: `Claim accepted! Sale created.`, relatedLiveClaimId: claim.id },
  });

  return NextResponse.json({ claim: { ...claim, status: 'CONVERTED_TO_SALE' }, sale });
}
