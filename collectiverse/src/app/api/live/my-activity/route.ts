import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  // Reminders
  const reminders = await (prisma as any).liveEventReminder.findMany({
    where: { userId, status: 'ACTIVE' },
    orderBy: { remindAt: 'asc' },
    take: 10,
  });
  // Enrich reminders with event info
  const reminderEvents = [];
  for (const r of reminders) {
    const event = await (prisma as any).liveEvent.findUnique({ where: { id: r.liveEventId }, select: { id: true, title: true, scheduledStartAt: true, status: true, sellerUserId: true } });
    const seller = event ? await (prisma as any).user.findUnique({ where: { id: event.sellerUserId }, select: { displayName: true, username: true } }) : null;
    reminderEvents.push({ ...r, event, seller: seller?.displayName || seller?.username || 'Seller' });
  }

  // Claims
  const claims = await (prisma as any).liveClaim.findMany({
    where: { buyerUserId: userId },
    orderBy: { createdAt: 'desc' },
    take: 15,
  });

  // Bids
  const bids = await (prisma as any).liveBid.findMany({
    where: { bidderUserId: userId },
    orderBy: { createdAt: 'desc' },
    take: 15,
  });

  // Break spots
  const breakSpots = await (prisma as any).liveBreakSpot.findMany({
    where: { buyerUserId: userId },
    orderBy: { createdAt: 'desc' },
    include: { liveBreak: { select: { id: true, title: true, status: true, liveEventId: true } } },
    take: 15,
  });

  // Break hits assigned to user
  const breakHits = await (prisma as any).liveBreakHit.findMany({
    where: { assignedToUserId: userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Live purchases (sales where buyer is this user and came from live)
  const livePurchases = await (prisma as any).sale.findMany({
    where: { buyerUserId: userId, status: { notIn: ['CANCELLED'] } },
    orderBy: { updatedAt: 'desc' },
    take: 15,
  });

  // Required actions
  const requiredActions = [];
  const paymentNeeded = await (prisma as any).sale.findMany({ where: { buyerUserId: userId, status: 'PAYMENT_PENDING' }, take: 5 });
  for (const s of paymentNeeded) requiredActions.push({ type: 'PAYMENT', saleId: s.id, label: 'Complete payment' });

  const deliveryConfirm = await (prisma as any).sale.findMany({ where: { buyerUserId: userId, status: 'SHIPPED' }, take: 5 });
  for (const s of deliveryConfirm) requiredActions.push({ type: 'CONFIRM_DELIVERY', saleId: s.id, label: 'Confirm delivery' });

  const transferAccept = await (prisma as any).sale.findMany({ where: { buyerUserId: userId, status: 'TRANSFER_PENDING' }, take: 5 });
  for (const s of transferAccept) requiredActions.push({ type: 'ACCEPT_TRANSFER', saleId: s.id, label: 'Accept transfer' });

  const feedbackNeeded = await (prisma as any).sale.findMany({ where: { buyerUserId: userId, status: 'FEEDBACK_PENDING' }, take: 5 });
  for (const s of feedbackNeeded) requiredActions.push({ type: 'LEAVE_FEEDBACK', saleId: s.id, label: 'Leave feedback' });

  return NextResponse.json({
    reminders: reminderEvents,
    claims,
    bids,
    breakSpots,
    breakHits,
    livePurchases,
    requiredActions,
  });
}
