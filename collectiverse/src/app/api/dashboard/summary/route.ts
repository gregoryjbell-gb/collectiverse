import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.sub;

  const items = await prisma.inventoryItem.findMany({
    where: { userId },
    include: { card: { include: { person: true, set: true } } },
  });

  const totalCards = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalEstimatedValue = items.reduce((sum, i) => sum + (i.estimatedValue || 0) * i.quantity, 0);
  const totalInvested = items.reduce((sum, i) => sum + (i.purchasePrice || 0) * i.quantity, 0);
  const forSaleCount = items.filter((i) => i.status === 'FOR_SALE').length;
  const rawCount = items.filter((i) => i.condition === 'RAW' || !i.condition).length;
  const gradedCount = items.filter((i) => i.condition && i.condition !== 'RAW').length;

  const topByValue = [...items]
    .sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0))
    .slice(0, 10)
    .map((i) => ({
      id: i.id,
      cardId: i.cardId,
      playerName: i.card.person?.displayName || 'Unknown',
      setName: i.card.set?.name || '',
      cardNumber: i.card.cardNumber,
      estimatedValue: i.estimatedValue,
      condition: i.condition,
      gradeValue: i.gradeValue,
    }));

  const recentAdditions = [...items]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
    .map((i) => ({
      id: i.id,
      cardId: i.cardId,
      playerName: i.card.person?.displayName || 'Unknown',
      setName: i.card.set?.name || '',
      cardNumber: i.card.cardNumber,
      condition: i.condition,
      gradeValue: i.gradeValue,
      addedAt: i.createdAt,
    }));

  const statusBreakdown = items.reduce((acc: Record<string, number>, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    totalCards,
    totalEstimatedValue,
    totalInvested,
    forSaleCount,
    rawCount,
    gradedCount,
    topByValue,
    recentAdditions,
    statusBreakdown,
  });
}
