import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const transfer = await (prisma as any).ownershipTransfer.findFirst({
    where: { id: params.id, OR: [{ fromUserId: userId }, { toUserId: userId }] },
  });
  if (!transfer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ transfer });
}
