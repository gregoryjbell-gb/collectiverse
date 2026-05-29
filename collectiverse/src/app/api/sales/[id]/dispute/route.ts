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

  if (sale.sellerUserId !== userId && sale.buyerUserId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { reason, description } = body;

  if (!reason || !description) {
    return NextResponse.json({ error: 'reason and description are required' }, { status: 400 });
  }

  const againstUserId = userId === sale.buyerUserId ? sale.sellerUserId : sale.buyerUserId;

  const dispute = await (prisma as any).dispute.create({
    data: {
      openedByUserId: userId,
      againstUserId: againstUserId || userId,
      listingId: sale.listingId,
      offerId: sale.offerId,
      transferId: sale.transferId,
      status: 'OPEN',
      reason,
      description,
    },
  });

  const updated = await (prisma as any).sale.update({
    where: { id: params.id },
    data: { status: 'DISPUTED' },
  });

  // Notify the other party
  if (againstUserId) {
    await createNotification({
      userId: againstUserId,
      type: 'DISPUTE_OPENED',
      title: 'Dispute Opened',
      message: `A dispute has been opened regarding a sale: ${reason}`,
      entityType: 'SALE',
      entityId: sale.id,
    });
  }

  return NextResponse.json({ sale: updated, dispute });
}
