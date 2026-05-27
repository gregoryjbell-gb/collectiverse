import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const [players, cards, sets, teams] = await Promise.all([
    prisma.person.findMany({
      where: { displayName: { contains: q, mode: 'insensitive' } },
      select: { id: true, displayName: true },
      take: 5,
    }),
    prisma.card.findMany({
      where: {
        OR: [
          { person: { displayName: { contains: q, mode: 'insensitive' } } },
          { cardNumber: { contains: q } },
          { id: { startsWith: q } },
        ],
      },
      select: { id: true, cardNumber: true, person: { select: { displayName: true } }, set: { select: { name: true } } },
      take: 5,
    }),
    prisma.cardSet.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: { id: true, name: true, year: true },
      take: 5,
    }),
    prisma.team.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: { id: true, name: true },
      take: 5,
    }),
  ]);

  const results = [
    ...players.map((p) => ({ type: 'player', id: p.id, label: p.displayName, href: `/players/${p.id}` })),
    ...cards.map((c) => ({ type: 'card', id: c.id, label: `${c.person?.displayName || 'Card'} #${c.cardNumber}`, sublabel: c.set?.name, href: `/cards/${c.id}` })),
    ...sets.map((s) => ({ type: 'set', id: s.id, label: s.name, sublabel: `${s.year}`, href: `/sets/${s.id}` })),
    ...teams.map((t) => ({ type: 'team', id: t.id, label: t.name, href: `/teams/${t.id}` })),
  ];

  return NextResponse.json({ results });
}
