import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  await (prisma as any).userOnboarding.upsert({
    where: { userId_stepKey: { userId, stepKey: 'DISMISSED' } },
    update: { dismissed: true },
    create: { userId, stepKey: 'DISMISSED', dismissed: true },
  });

  return NextResponse.json({ success: true });
}
