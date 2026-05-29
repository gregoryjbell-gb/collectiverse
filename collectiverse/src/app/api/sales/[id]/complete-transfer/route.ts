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
  if (sale.buyerUserId !== userId) return NextResponse.json({ error: 'Only buyer can complete transfer' }, { status: 403 });

  if (sale.transferId) {
    await (prisma as any).ownershipTransfer.update({
      where: { id: sale.transferId },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });
  }

  // Mark listing as SOLD
  if (sale.listingId) {
    await (prisma as any).listing.update({
      where: { id: sale.listingId },
      data: { status: 'SOLD', soldAt: new Date() },
    });
  }

  const updated = await (prisma as any).sale.update({
    where: { id: params.id },
    data: { status: 'FEEDBACK_PENDING', completedAt: new Date() },
  });

  await createNotification({
    userId: sale.sellerUserId,
    type: 'SALE_TRANSFER_COMPLETED',
    title: 'Transfer Completed',
    message: 'Buyer accepted the ownership transfer. Sale is nearly complete!',
    entityType: 'SALE',
    entityId: sale.id,
  });

  if (sale.buyerUserId) {
    await createNotification({
      userId: sale.buyerUserId,
      type: 'SALE_FEEDBACK_REQUESTED',
      title: 'Leave Feedback',
      message: 'Transaction complete! Please leave feedback for the seller.',
      entityType: 'SALE',
      entityId: sale.id,
    });
  }

  return NextResponse.json({ sale: updated });
}
