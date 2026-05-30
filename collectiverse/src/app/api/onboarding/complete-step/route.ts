import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const { stepKey } = await req.json();
  if (!stepKey) return NextResponse.json({ error: 'stepKey required' }, { status: 400 });

  await (prisma as any).userOnboarding.upsert({
    where: { userId_stepKey: { userId, stepKey } },
    update: { completed: true, completedAt: new Date() },
    create: { userId, stepKey, completed: true, completedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
