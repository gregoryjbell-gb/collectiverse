import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const claim = await (prisma as any).liveClaim.findUnique({ where: { id: params.id } });
  if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
  if (claim.sellerUserId !== userId) return NextResponse.json({ error: 'Only seller can decline' }, { status: 403 });

  await (prisma as any).liveClaim.update({ where: { id: params.id }, data: { status: 'DECLINED' } });

  // Reset item to presenting so others can claim
  await (prisma as any).liveEventItem.update({ where: { id: claim.liveEventItemId }, data: { status: 'PRESENTING' } });

  return NextResponse.json({ success: true });
}
