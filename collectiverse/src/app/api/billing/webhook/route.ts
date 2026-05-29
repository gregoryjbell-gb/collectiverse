import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  // In production: verify signature with Stripe
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);

  // For now, parse JSON directly (NOT safe for production)
  let event: any;
  try { event = JSON.parse(body); } catch { return NextResponse.json({ error: 'Invalid payload' }, { status: 400 }); }

  // Log event
  await (prisma as any).stripeEvent.create({
    data: { stripeEventId: event.id || `evt_${Date.now()}`, eventType: event.type || 'unknown', payload: body },
  }).catch(() => {});

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data?.object;
      if (session?.metadata?.userId && session?.subscription) {
        await (prisma as any).userSubscription.updateMany({
          where: { userId: session.metadata.userId },
          data: { stripeCustomerId: session.customer, stripeSubscriptionId: session.subscription, status: 'ACTIVE' },
        });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data?.object;
      if (sub?.id) {
        const data: any = { status: sub.status === 'active' ? 'ACTIVE' : sub.status === 'past_due' ? 'PAST_DUE' : sub.status === 'canceled' ? 'CANCELLED' : 'ACTIVE' };
        if (sub.current_period_start) data.currentPeriodStart = new Date(sub.current_period_start * 1000);
        if (sub.current_period_end) data.currentPeriodEnd = new Date(sub.current_period_end * 1000);
        if (sub.cancel_at_period_end !== undefined) data.cancelAtPeriodEnd = sub.cancel_at_period_end;
        await (prisma as any).userSubscription.updateMany({ where: { stripeSubscriptionId: sub.id }, data });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data?.object;
      if (sub?.id) {
        await (prisma as any).userSubscription.updateMany({ where: { stripeSubscriptionId: sub.id }, data: { status: 'CANCELLED', cancellationDate: new Date() } });
      }
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data?.object;
      if (invoice?.subscription) {
        await (prisma as any).userSubscription.updateMany({ where: { stripeSubscriptionId: invoice.subscription }, data: { status: 'PAST_DUE' } });
      }
      break;
    }
  }

  // Mark processed
  if (event.id) {
    await (prisma as any).stripeEvent.updateMany({ where: { stripeEventId: event.id }, data: { processed: true, processedAt: new Date() } }).catch(() => {});
  }

  return NextResponse.json({ received: true });
}
