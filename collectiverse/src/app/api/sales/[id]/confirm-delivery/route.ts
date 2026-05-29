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
  if (sale.buyerUserId !== userId) return NextResponse.json({ error: 'Only buyer can confirm delivery' }, { status: 403 });

  if (sale.shipmentId) {
    await (prisma as any).shipment.update({
      where: { id: sale.shipmentId },
      data: { shippingStatus: 'DELIVERED', deliveredAt: new Date() },
    });
  }

  const updated = await (prisma as any).sale.update({
    where: { id: params.id },
    data: { status: 'TRANSFER_PENDING' },
  });

  await createNotification({
    userId: sale.sellerUserId,
    type: 'SALE_DELIVERED',
    title: 'Delivery Confirmed',
    message: 'Buyer confirmed delivery. Please initiate ownership transfer.',
    entityType: 'SALE',
    entityId: sale.id,
  });

  return NextResponse.json({ sale: updated });
}
