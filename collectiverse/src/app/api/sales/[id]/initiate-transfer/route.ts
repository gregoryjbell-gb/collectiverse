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
  if (sale.sellerUserId !== userId) return NextResponse.json({ error: 'Only seller can initiate transfer' }, { status: 403 });

  if (sale.transferId) {
    await (prisma as any).ownershipTransfer.update({
      where: { id: sale.transferId },
      data: { status: 'PENDING' },
    });
  }

  // Mark inventory item/group as SOLD
  if (sale.inventoryItemId) {
    await (prisma as any).inventoryItem.update({
      where: { id: sale.inventoryItemId },
      data: { status: 'SOLD' },
    });
  }
  if (sale.inventoryGroupId) {
    await (prisma as any).inventoryGroup.update({
      where: { id: sale.inventoryGroupId },
      data: { status: 'SOLD' },
    });
  }

  const updated = await (prisma as any).sale.update({
    where: { id: params.id },
    data: { status: 'TRANSFER_PENDING' },
  });

  if (sale.buyerUserId) {
    await createNotification({
      userId: sale.buyerUserId,
      type: 'SALE_TRANSFER_INITIATED',
      title: 'Ownership Transfer Initiated',
      message: 'Seller has initiated ownership transfer. Please accept.',
      entityType: 'SALE',
      entityId: sale.id,
    });
  }

  return NextResponse.json({ sale: updated });
}
