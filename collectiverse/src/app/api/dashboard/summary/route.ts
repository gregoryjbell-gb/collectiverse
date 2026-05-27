import { NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const items = await prisma.inventoryItem.findMany({
    where: { userId },
    include: { card: { include: { person: true, set: { include: { sport: true } }, team: true } } },
  });

  const totalCards = items.reduce((sum, i) => sum + i.quantity, 0);
  const distinctCards = new Set(items.map(i => i.cardId)).size;
  const totalEstimatedValue = items.reduce((sum, i) => sum + (i.estimatedValue || 0) * i.quantity, 0);
  const totalInvested = items.reduce((sum, i) => sum + (i.purchasePrice || 0) * i.quantity, 0);
  const gainLoss = totalEstimatedValue - totalInvested;
  const roi = totalInvested > 0 ? ((gainLoss / totalInvested) * 100) : 0;
  const forSaleCount = items.filter(i => i.status === 'FOR_SALE').length;
  const watchlistCount = items.filter(i => i.status === 'WATCHLIST').length;
  const rawCount = items.filter(i => !i.condition || i.condition === 'RAW').length;
  const gradedCount = items.filter(i => i.condition && i.condition !== 'RAW').length;

  const topByValue = [...items]
    .sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0))
    .slice(0, 10)
    .map(i => ({
      id: i.id, cardId: i.cardId,
      playerName: i.card.person?.displayName || 'Unknown',
      setName: i.card.set?.name || '', cardNumber: i.card.cardNumber,
      estimatedValue: i.estimatedValue, purchasePrice: i.purchasePrice,
      condition: i.condition, gradeValue: i.gradeValue,
    }));

  const recentAdditions = [...items]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
    .map(i => ({
      id: i.id, cardId: i.cardId,
      playerName: i.card.person?.displayName || 'Unknown',
      setName: i.card.set?.name || '', cardNumber: i.card.cardNumber,
      condition: i.condition, gradeValue: i.gradeValue, addedAt: i.createdAt,
    }));

  // Breakdowns
  const bySport: Record<string, number> = {};
  const bySet: Record<string, number> = {};
  const byManufacturer: Record<string, number> = {};
  const byStorage: Record<string, number> = {};
  const statusBreakdown: Record<string, number> = {};

  for (const i of items) {
    const sport = i.card.set?.sport?.name || 'Unknown';
    const setName = i.card.set?.name || 'Unknown';
    const mfr = i.card.set?.manufacturer || 'Unknown';
    const loc = i.storageLocation || 'Unassigned';
    bySport[sport] = (bySport[sport] || 0) + i.quantity;
    bySet[setName] = (bySet[setName] || 0) + i.quantity;
    byManufacturer[mfr] = (byManufacturer[mfr] || 0) + i.quantity;
    byStorage[loc] = (byStorage[loc] || 0) + i.quantity;
    statusBreakdown[i.status] = (statusBreakdown[i.status] || 0) + 1;
  }

  return NextResponse.json({
    totalCards, distinctCards, totalEstimatedValue, totalInvested,
    gainLoss, roi: Math.round(roi * 10) / 10,
    forSaleCount, watchlistCount, rawCount, gradedCount,
    topByValue, recentAdditions,
    statusBreakdown, bySport, bySet, byManufacturer, byStorage,
  });
}
