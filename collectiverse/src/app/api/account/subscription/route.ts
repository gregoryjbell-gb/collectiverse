import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const sub = await (prisma as any).userSubscription.findFirst({
    where: { userId, status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] } },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!sub) return NextResponse.json({ plan: { name: 'Explorer', tier: 'EXPLORER', description: 'Free plan' }, status: 'ACTIVE' });

  return NextResponse.json({ ...sub, plan: sub.plan });
}
