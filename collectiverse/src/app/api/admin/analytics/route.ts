import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [totalCards, totalPlayers, totalScans, topScanned] = await Promise.all([
    prisma.card.count(),
    prisma.person.count(),
    prisma.qrScan.count(),
    prisma.qrScan.groupBy({
      by: ['cardId'],
      _count: { cardId: true },
      orderBy: { _count: { cardId: 'desc' } },
      take: 10,
    }),
  ]);

  const totalValue = await prisma.card.aggregate({ _sum: { estimatedValue: true } });

  // Get card details for top scanned
  const topCards = await Promise.all(
    topScanned.map(async (s: { cardId: string; _count: { cardId: number } }) => {
      const card = await prisma.card.findUnique({
        where: { id: s.cardId },
        include: { person: true },
      });
      return { cardId: s.cardId, scans: s._count.cardId, playerName: card?.person?.displayName || 'Unknown' };
    })
  );

  return NextResponse.json({
    totalCards,
    totalPlayers,
    totalScans,
    totalValue: totalValue._sum.estimatedValue || 0,
    topScanned: topCards,
  });
}
