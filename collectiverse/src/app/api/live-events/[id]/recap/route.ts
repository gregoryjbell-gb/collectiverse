import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const event = await (prisma as any).liveEvent.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const recap = await (prisma as any).liveEventRecap.findUnique({ where: { liveEventId: params.id } });

  const isSeller = event.sellerUserId === userId;

  // Seller sees full recap
  if (isSeller || session.role === 'ADMIN') {
    const pendingPayments = await (prisma as any).sale.count({ where: { sellerUserId: event.sellerUserId, status: 'PAYMENT_PENDING' } });
    const readyToShip = await (prisma as any).sale.count({ where: { sellerUserId: event.sellerUserId, status: 'READY_TO_SHIP' } });
    const transfersPending = await (prisma as any).sale.count({ where: { sellerUserId: event.sellerUserId, status: 'TRANSFER_PENDING' } });

    return NextResponse.json({ recap, event: { id: event.id, title: event.title, status: event.status }, isSeller: true, fulfillment: { pendingPayments, readyToShip, transfersPending } });
  }

  // Buyer sees only their participation
  const myClaims = await (prisma as any).liveClaim.findMany({ where: { liveEventId: params.id, buyerUserId: userId } });
  const myBids = await (prisma as any).liveBid.findMany({ where: { liveEventId: params.id, bidderUserId: userId } });
  const myBreakSpots = await (prisma as any).liveBreakSpot.findMany({
    where: { buyerUserId: userId, liveBreak: { liveEventId: params.id } },
    include: { liveBreak: { select: { title: true } } },
  });
  const mySales = await (prisma as any).sale.findMany({ where: { buyerUserId: userId }, orderBy: { createdAt: 'desc' }, take: 10 });

  // Required actions
  const requiredActions = [];
  const paymentNeeded = mySales.filter((s: any) => s.status === 'PAYMENT_PENDING');
  const deliveryConfirm = mySales.filter((s: any) => s.status === 'SHIPPED');
  const transferAccept = mySales.filter((s: any) => s.status === 'TRANSFER_PENDING');

  for (const s of paymentNeeded) requiredActions.push({ type: 'PAYMENT', saleId: s.id });
  for (const s of deliveryConfirm) requiredActions.push({ type: 'CONFIRM_DELIVERY', saleId: s.id });
  for (const s of transferAccept) requiredActions.push({ type: 'ACCEPT_TRANSFER', saleId: s.id });

  return NextResponse.json({
    recap, event: { id: event.id, title: event.title, status: event.status },
    isSeller: false,
    myClaims, myBids, myBreakSpots, mySales: mySales.slice(0, 5), requiredActions,
  });
}
