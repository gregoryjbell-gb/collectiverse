import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Cards needing review: missing images, missing metadata, recently created
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const filter = req.nextUrl.searchParams.get('filter') || 'all';

  let where: any = {};
  if (filter === 'no_image') where.frontImageUrl = null;
  if (filter === 'no_metadata') where.OR = [{ personId: null }, { setId: null }, { cardNumber: null }];

  const cards = await prisma.card.findMany({
    where,
    include: {
      person: { select: { displayName: true } },
      set: { select: { name: true, year: true } },
      team: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ cards });
}
