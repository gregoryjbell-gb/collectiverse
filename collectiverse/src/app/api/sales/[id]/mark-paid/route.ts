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

  // Buyer or admin can mark paid
  if (sale.buyerUserId !== userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only buyer or admin can mark paid' }, { status: 403 });
  }

  if (sale.paymentId) {
    await (prisma as any).paymentIntent.update({
      where: { id: sale.paymentId },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  const updated = await (prisma as any).sale.update({
    where: { id: params.id },
    data: { status: 'READY_TO_SHIP' },
  });

  await createNotification({
    userId: sale.sellerUserId,
    type: 'SALE_PAYMENT_RECEIVED',
    title: 'Payment Received',
    message: 'Payment has been marked as paid. Please ship the item.',
    entityType: 'SALE',
    entityId: sale.id,
  });

  return NextResponse.json({ sale: updated });
}
