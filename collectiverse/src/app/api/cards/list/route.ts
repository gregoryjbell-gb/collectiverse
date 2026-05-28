import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const q = url.searchParams.get('q');
  const sport = url.searchParams.get('sport');
  const year = url.searchParams.get('year');
  const manufacturer = url.searchParams.get('manufacturer');
  const setId = url.searchParams.get('set');
  const teamId = url.searchParams.get('team');
  const rookie = url.searchParams.get('rookie');
  const autograph = url.searchParams.get('autograph');
  const relic = url.searchParams.get('relic');
  const sort = url.searchParams.get('sort') || 'newest';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') || '25')));
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (q) {
    where.OR = [
      { person: { displayName: { contains: q, mode: 'insensitive' } } },
      { set: { name: { contains: q, mode: 'insensitive' } } },
      { cardNumber: { contains: q } },
      { team: { name: { contains: q, mode: 'insensitive' } } },
      { franchise: { contains: q, mode: 'insensitive' } },
      { characterName: { contains: q, mode: 'insensitive' } },
      { actorName: { contains: q, mode: 'insensitive' } },
      { artistName: { contains: q, mode: 'insensitive' } },
      { subjectName: { contains: q, mode: 'insensitive' } },
    ];
  }

  const cardCategory = url.searchParams.get('cardCategory');
  const franchise = url.searchParams.get('franchise');
  if (cardCategory) where.cardCategory = cardCategory;
  if (franchise) where.franchise = { contains: franchise, mode: 'insensitive' };
  if (sport) where.set = { ...(where.set || {}), sport: { name: { equals: sport, mode: 'insensitive' } } };
  if (year) where.year = parseInt(year);
  if (manufacturer) where.set = { ...(where.set || {}), manufacturer: { contains: manufacturer, mode: 'insensitive' } };
  if (setId) where.setId = setId;
  if (teamId) where.teamId = teamId;
  if (rookie === 'true') where.rookie = true;
  if (autograph === 'true') where.autograph = true;
  if (relic === 'true') where.relic = true;

  let orderBy: any;
  switch (sort) {
    case 'year_asc': orderBy = { year: 'asc' }; break;
    case 'year_desc': orderBy = { year: 'desc' }; break;
    case 'player_az': orderBy = { person: { displayName: 'asc' } }; break;
    case 'value_high': orderBy = { estimatedValue: 'desc' }; break;
    case 'value_low': orderBy = { estimatedValue: 'asc' }; break;
    default: orderBy = { createdAt: 'desc' };
  }

  const [items, total] = await Promise.all([
    prisma.card.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        person: { select: { id: true, displayName: true } },
        team: { select: { id: true, name: true } },
        set: { select: { id: true, name: true, year: true, manufacturer: true, sport: { select: { name: true } } } },
      },
    }),
    prisma.card.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map(c => ({
      id: c.id,
      playerName: c.person?.displayName || 'Unknown',
      personId: c.personId,
      cardNumber: c.cardNumber,
      year: c.year,
      setName: c.set?.name || '',
      setId: c.setId,
      manufacturer: c.set?.manufacturer || '',
      sport: c.set?.sport?.name || '',
      teamName: c.team?.name || '',
      teamId: c.teamId,
      rookie: c.rookie,
      autograph: c.autograph,
      relic: c.relic,
      parallel: c.parallel,
      estimatedValue: c.estimatedValue,
      frontImageUrl: c.frontImageUrl,
      thumbImageUrl: c.frontImageUrl ? c.frontImageUrl.replace('-display.', '-thumb.') : null,
      cardCategory: c.cardCategory,
      franchise: c.franchise,
      characterName: c.characterName,
      actorName: c.actorName,
      artistName: c.artistName,
      subjectName: c.subjectName,
      universe: c.universe,
      genre: c.genre,
    })),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}
