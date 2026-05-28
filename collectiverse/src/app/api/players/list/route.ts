import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const q = url.searchParams.get('q');
  const sport = url.searchParams.get('sport');
  const hallOfFame = url.searchParams.get('hof');
  const sort = url.searchParams.get('sort') || 'name_az';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '25')));
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (q) where.displayName = { contains: q, mode: 'insensitive' };
  if (sport) where.personSports = { some: { sport: { name: { equals: sport, mode: 'insensitive' } } } };
  if (hallOfFame === 'true') where.hallOfFame = true;

  let orderBy: any;
  switch (sort) {
    case 'name_az': orderBy = { displayName: 'asc' }; break;
    case 'name_za': orderBy = { displayName: 'desc' }; break;
    case 'newest': orderBy = { createdAt: 'desc' }; break;
    default: orderBy = { displayName: 'asc' };
  }

  const [items, total] = await Promise.all([
    prisma.person.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        personSports: { include: { sport: { select: { name: true } } } },
        _count: { select: { cards: true } },
      },
    }),
    prisma.person.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map(p => ({
      id: p.id,
      displayName: p.displayName,
      hallOfFame: p.hallOfFame,
      sports: p.personSports.map(ps => ps.sport.name),
      cardCount: p._count.cards,
      biography: p.biography,
    })),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}
