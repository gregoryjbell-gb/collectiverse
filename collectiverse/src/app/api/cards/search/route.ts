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
  const cardNumber = url.searchParams.get('cardNumber');

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
  if (sport) where.set = { ...where.set, sport: { name: { equals: sport, mode: 'insensitive' } } };
  if (year) where.year = parseInt(year);
  if (manufacturer) where.set = { ...where.set, manufacturer: { contains: manufacturer, mode: 'insensitive' } };
  if (setId) where.setId = setId;
  if (teamId) where.teamId = teamId;
  if (cardNumber) where.cardNumber = { contains: cardNumber };

  const cards = await prisma.card.findMany({
    where,
    include: {
      person: { select: { id: true, displayName: true } },
      team: { select: { id: true, name: true } },
      set: { select: { id: true, name: true, year: true, manufacturer: true, sport: { select: { name: true } } } },
    },
    orderBy: [{ person: { displayName: 'asc' } }, { year: 'desc' }],
    take: 50,
  });

  const results = cards.map(c => ({
    cardId: c.id,
    playerName: c.person?.displayName || 'Unknown',
    setName: c.set?.name || '',
    manufacturer: c.set?.manufacturer || '',
    year: c.year || c.set?.year,
    sport: c.set?.sport?.name || '',
    teamName: c.team?.name || '',
    cardNumber: c.cardNumber,
    rookie: c.rookie,
    autograph: c.autograph,
    relic: c.relic,
    parallel: c.parallel,
    frontImageUrl: c.frontImageUrl,
  }));

  return NextResponse.json({ results, total: results.length });
}
