import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Find potential duplicate cards
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find cards with same person + set + year + cardNumber (different parallel or id)
  const cards = await prisma.card.findMany({
    include: {
      person: { select: { id: true, displayName: true } },
      set: { select: { id: true, name: true, year: true } },
      team: { select: { name: true } },
    },
    orderBy: [{ personId: 'asc' }, { setId: 'asc' }, { cardNumber: 'asc' }],
  });

  // Group by person+set+year+cardNumber
  const groups: Record<string, typeof cards> = {};
  for (const card of cards) {
    const key = `${card.personId}|${card.setId}|${card.year}|${card.cardNumber}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  }

  // Only return groups with more than 1 card (potential duplicates)
  const duplicates = Object.values(groups)
    .filter(g => g.length > 1)
    .map(g => ({
      key: `${g[0].person?.displayName} - ${g[0].set?.name} #${g[0].cardNumber} (${g[0].year})`,
      cards: g.map(c => ({
        id: c.id,
        playerName: c.person?.displayName,
        setName: c.set?.name,
        year: c.year,
        cardNumber: c.cardNumber,
        parallel: c.parallel,
        teamName: c.team?.name,
      })),
    }));

  return NextResponse.json({ duplicates, total: duplicates.length });
}
