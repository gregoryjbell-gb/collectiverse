import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Find cards with same person + set + cardNumber (potential duplicates)
  const cards = await (prisma as any).card.findMany({
    include: {
      person: { select: { id: true, displayName: true } },
      set: { select: { id: true, name: true, year: true } },
      team: { select: { id: true, name: true } },
      _count: { select: { inventoryItems: true } },
    },
    orderBy: [{ setId: 'asc' }, { cardNumber: 'asc' }],
  });

  // Group by person+set+cardNumber to find duplicates
  const groups: Record<string, any[]> = {};
  for (const card of cards) {
    const key = `${card.personId || ''}|${card.setId || ''}|${card.cardNumber || ''}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  }

  // Only return groups with more than one card
  const duplicates = Object.values(groups)
    .filter(g => g.length > 1)
    .map(g => ({ key: `${g[0].person?.displayName} - ${g[0].set?.name} #${g[0].cardNumber}`, cards: g }));

  return NextResponse.json({ duplicates });
}
