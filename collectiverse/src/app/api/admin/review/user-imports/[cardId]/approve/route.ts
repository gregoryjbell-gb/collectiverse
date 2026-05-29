import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { cardId: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await (prisma as any).card.update({
    where: { id: params.cardId },
    data: { publicDataStatus: 'ADMIN_VERIFIED', status: 'approved' },
  });

  return NextResponse.json({ success: true });
}
