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

  // Seller, buyer, or admin can cancel
  if (sale.sellerUserId !== userId && sale.buyerUserId !== userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Cannot cancel completed sales
  if (['COMPLETED', 'TRANSFER_COMPLETED'].includes(sale.status)) {
    return NextResponse.json({ error: 'Cannot cancel a completed sale' }, { status: 400 });
  }

  const updated = await (prisma as any).sale.update({
    where: { id: params.id },
    data: { status: 'CANCELLED' },
  });

  // Restore inventory status
  if (sale.inventoryItemId) {
    await (prisma as any).inventoryItem.update({
      where: { id: sale.inventoryItemId },
      data: { status: 'OWNED' },
    }).catch(() => {});
  }
  if (sale.inventoryGroupId) {
    await (prisma as any).inventoryGroup.update({
      where: { id: sale.inventoryGroupId },
      data: { status: 'OWNED' },
    }).catch(() => {});
  }

  // Notify the other party
  const notifyUserId = userId === sale.sellerUserId ? sale.buyerUserId : sale.sellerUserId;
  if (notifyUserId) {
    await createNotification({
      userId: notifyUserId,
      type: 'SALE_CANCELLED',
      title: 'Sale Cancelled',
      message: 'A sale has been cancelled.',
      entityType: 'SALE',
      entityId: sale.id,
    });
  }

  return NextResponse.json({ sale: updated });
}
