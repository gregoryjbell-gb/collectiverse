import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const transfer = await (prisma as any).ownershipTransfer.findFirst({
    where: { id: params.id, toUserId: userId, status: 'PENDING' },
  });
  if (!transfer) return NextResponse.json({ error: 'Transfer not found or not pending' }, { status: 404 });

  await (prisma as any).ownershipTransfer.update({
    where: { id: params.id },
    data: { status: 'DECLINED', declinedAt: new Date() },
  });

  return NextResponse.json({ success: true, message: 'Transfer declined.' });
}
