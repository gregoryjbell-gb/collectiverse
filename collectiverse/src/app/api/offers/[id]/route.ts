import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const offer = await (prisma as any).offer.findUnique({ where: { id: params.id } });
  if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });

  const { status, counterAmount } = await req.json();

  // Seller can accept/decline/counter
  if (['ACCEPTED', 'DECLINED', 'COUNTERED'].includes(status)) {
    if (offer.sellerUserId !== userId) return NextResponse.json({ error: 'Only seller can respond' }, { status: 403 });
  }
  // Buyer can cancel
  if (status === 'CANCELLED') {
    if (offer.buyerUserId !== userId) return NextResponse.json({ error: 'Only buyer can cancel' }, { status: 403 });
  }

  const updateData: any = { status };
  if (status === 'COUNTERED' && counterAmount) updateData.counterAmount = parseFloat(counterAmount);

  const updated = await (prisma as any).offer.update({ where: { id: params.id }, data: updateData });

  // Notify
  if (status === 'ACCEPTED') {
    await createNotification({ userId: offer.buyerUserId, type: 'TRANSFER_ACCEPTED', title: 'Offer Accepted!', message: `Your $${offer.amount} offer was accepted.`, entityType: 'LISTING', entityId: offer.listingId });
  } else if (status === 'DECLINED') {
    await createNotification({ userId: offer.buyerUserId, type: 'TRANSFER_DECLINED', title: 'Offer Declined', message: `Your $${offer.amount} offer was declined.`, entityType: 'LISTING', entityId: offer.listingId });
  } else if (status === 'COUNTERED') {
    await createNotification({ userId: offer.buyerUserId, type: 'TRANSFER_RECEIVED', title: 'Counter Offer', message: `Seller countered with $${counterAmount}.`, entityType: 'LISTING', entityId: offer.listingId });
  }

  return NextResponse.json({ offer: updated });
}
