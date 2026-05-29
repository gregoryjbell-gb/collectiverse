import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const liveBreak = await (prisma as any).liveBreak.findUnique({ where: { id: params.id } });
  if (!liveBreak || liveBreak.sellerUserId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await (prisma as any).liveBreak.update({ where: { id: params.id }, data: { status: 'BREAKING' } });

  await (prisma as any).liveEventMessage.create({
    data: { liveEventId: liveBreak.liveEventId, messageType: 'SYSTEM', message: `📦 Break started: "${liveBreak.title}"` },
  });

  return NextResponse.json({ success: true });
}
