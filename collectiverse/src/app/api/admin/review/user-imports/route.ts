import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const cards = await (prisma as any).card.findMany({
    where: { publicDataStatus: { in: ['USER_IMPORTED', 'NEEDS_REVIEW'] } },
    include: {
      person: { select: { displayName: true } },
      set: { select: { name: true, year: true } },
      team: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ cards, total: cards.length });
}
