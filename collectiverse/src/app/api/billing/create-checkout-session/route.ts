import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const { planId, billingPeriod } = body;

  const plan = await (prisma as any).membershipPlan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  const priceId = billingPeriod === 'YEARLY' ? plan.stripeYearlyPriceId : plan.stripeMonthlyPriceId;
  if (!priceId) return NextResponse.json({ error: 'Stripe price not configured for this plan. Coming soon.' }, { status: 400 });

  // In production, create Stripe Checkout Session here:
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  // const checkoutSession = await stripe.checkout.sessions.create({...});
  // return NextResponse.json({ url: checkoutSession.url });

  // For now, return mock response
  return NextResponse.json({ message: 'Stripe integration coming soon. Plan selected: ' + plan.name, planId, billingPeriod });
}
