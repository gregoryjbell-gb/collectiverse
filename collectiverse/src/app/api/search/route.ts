import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  const category = req.nextUrl.searchParams.get('category');
  const franchise = req.nextUrl.searchParams.get('franchise');
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const cardWhere: any = {
    OR: [
      { person: { displayName: { contains: q, mode: 'insensitive' } } },
      { cardNumber: { contains: q } },
      { characterName: { contains: q, mode: 'insensitive' } },
      { subjectName: { contains: q, mode: 'insensitive' } },
      { franchise: { contains: q, mode: 'insensitive' } },
    ],
  };
  if (category) cardWhere.cardCategory = category;
  if (franchise) cardWhere.franchise = { contains: franchise, mode: 'insensitive' };

  const [players, cards, sets, teams] = await Promise.all([
    prisma.person.findMany({
      where: { displayName: { contains: q, mode: 'insensitive' } },
      select: { id: true, displayName: true, subjectType: true },
      take: 5,
    }),
    prisma.card.findMany({
      where: cardWhere,
      select: { id: true, cardNumber: true, cardCategory: true, franchise: true, characterName: true, person: { select: { displayName: true } }, set: { select: { name: true } } },
      take: 5,
    }),
    prisma.cardSet.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: { id: true, name: true, year: true, category: true },
      take: 5,
    }),
    prisma.team.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: { id: true, name: true },
      take: 5,
    }),
  ]);

  const results = [
    ...players.map((p) => ({ type: p.subjectType === 'ATHLETE' ? 'player' : 'subject', id: p.id, label: p.displayName, href: `/players/${p.id}` })),
    ...cards.map((c) => ({ type: 'card', id: c.id, label: `${c.person?.displayName || c.characterName || 'Card'} #${c.cardNumber}`, sublabel: c.set?.name || c.franchise, category: c.cardCategory, href: `/cards/${c.id}` })),
    ...sets.map((s) => ({ type: 'set', id: s.id, label: s.name, sublabel: `${s.year}`, category: s.category, href: `/sets/${s.id}` })),
    ...teams.map((t) => ({ type: 'team', id: t.id, label: t.name, href: `/teams/${t.id}` })),
  ];

  return NextResponse.json({ results });
}
