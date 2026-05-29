import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const sub = await (prisma as any).userSubscription.findFirst({ where: { userId, status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] } } });
  if (!sub?.stripeCustomerId) return NextResponse.json({ error: 'No active billing. Upgrade first.' }, { status: 400 });

  // In production:
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  // const portalSession = await stripe.billingPortal.sessions.create({ customer: sub.stripeCustomerId, return_url: `${process.env.NEXT_PUBLIC_URL}/account/billing` });
  // return NextResponse.json({ url: portalSession.url });

  return NextResponse.json({ message: 'Stripe Customer Portal coming soon.' });
}
