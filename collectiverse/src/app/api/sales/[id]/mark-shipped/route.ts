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
  if (sale.sellerUserId !== userId) return NextResponse.json({ error: 'Only seller can mark shipped' }, { status: 403 });

  if (sale.shipmentId) {
    await (prisma as any).shipment.update({
      where: { id: sale.shipmentId },
      data: { shippingStatus: 'SHIPPED', shippedAt: new Date() },
    });
  }

  const updated = await (prisma as any).sale.update({
    where: { id: params.id },
    data: { status: 'SHIPPED' },
  });

  if (sale.buyerUserId) {
    await createNotification({
      userId: sale.buyerUserId,
      type: 'SALE_SHIPPED',
      title: 'Item Shipped',
      message: 'Your item has been shipped! Check tracking for updates.',
      entityType: 'SALE',
      entityId: sale.id,
    });
  }

  return NextResponse.json({ sale: updated });
}
