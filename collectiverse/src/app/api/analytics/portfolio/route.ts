import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  // Inventory items
  const items = await prisma.inventoryItem.findMany({
    where: { userId },
    include: { card: { include: { set: { include: { sport: true } }, person: true } } },
  });

  // Groups
  const groups = await (prisma as any).inventoryGroup.findMany({
    where: { userId },
    include: { cardSet: true, _count: { select: { items: true } } },
  });

  // Transactions (realized gains)
  const transactions = await (prisma as any).inventoryTransaction.findMany({
    where: { inventoryItem: { userId } },
  });

  // Listings
  const listings = await (prisma as any).listing.findMany({ where: { userId } });

  // Core metrics
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalValue = items.reduce((s, i) => s + (i.estimatedValue || 0) * i.quantity, 0);
  const totalInvested = items.reduce((s, i) => s + (i.purchasePrice || 0) * i.quantity, 0);
  const unrealizedGL = totalValue - totalInvested;
  const roi = totalInvested > 0 ? ((unrealizedGL / totalInvested) * 100) : 0;

  const salesTx = transactions.filter((t: any) => t.type === 'SALE');
  const realizedGL = salesTx.reduce((s: number, t: any) => s + (t.amount || 0), 0);
  const soldListings = listings.filter((l: any) => l.status === 'SOLD');
  const totalSoldValue = soldListings.reduce((s: number, l: any) => s + (l.price || 0), 0);
  const activeListings = listings.filter((l: any) => l.status === 'ACTIVE').length;

  // Graded vs raw
  const gradedCount = items.filter(i => i.condition && i.condition !== 'RAW').length;
  const rawCount = items.length - gradedCount;

  // By category
  const byCategory: Record<string, { count: number; value: number }> = {};
  const bySport: Record<string, { count: number; value: number }> = {};
  const byManufacturer: Record<string, { count: number; value: number }> = {};
  const byStatus: Record<string, number> = {};
  const byStorage: Record<string, number> = {};
  const byGradeCompany: Record<string, number> = {};

  for (const item of items) {
    const cat = (item.card as any).cardCategory || 'SPORTS';
    const sport = item.card.set?.sport?.name || 'Unknown';
    const mfr = item.card.set?.manufacturer || 'Unknown';
    const loc = item.storageLocation || 'Unassigned';

    if (!byCategory[cat]) byCategory[cat] = { count: 0, value: 0 };
    byCategory[cat].count += item.quantity;
    byCategory[cat].value += (item.estimatedValue || 0) * item.quantity;

    if (!bySport[sport]) bySport[sport] = { count: 0, value: 0 };
    bySport[sport].count += item.quantity;
    bySport[sport].value += (item.estimatedValue || 0) * item.quantity;

    if (!byManufacturer[mfr]) byManufacturer[mfr] = { count: 0, value: 0 };
    byManufacturer[mfr].count += item.quantity;
    byManufacturer[mfr].value += (item.estimatedValue || 0) * item.quantity;

    byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    byStorage[loc] = (byStorage[loc] || 0) + item.quantity;
    if (item.gradeCompany) byGradeCompany[item.gradeCompany] = (byGradeCompany[item.gradeCompany] || 0) + 1;
  }

  // Top items by value
  const topItems = [...items].sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0)).slice(0, 10).map(i => ({
    id: i.id, playerName: (i.card.person as any)?.displayName || '', setName: i.card.set?.name || '',
    cardNumber: i.card.cardNumber, estimatedValue: i.estimatedValue, condition: i.condition, gradeValue: i.gradeValue,
  }));

  // Top groups by value
  const topGroups = [...groups].sort((a: any, b: any) => (b.estimatedValue || 0) - (a.estimatedValue || 0)).slice(0, 5).map((g: any) => ({
    id: g.id, name: g.name, groupType: g.groupType, estimatedValue: g.estimatedValue, itemCount: g._count.items,
  }));

  // Acquisition timeline (items by month)
  const timeline: Record<string, number> = {};
  for (const item of items) {
    const month = item.createdAt.toISOString().slice(0, 7);
    timeline[month] = (timeline[month] || 0) + item.quantity;
  }

  // Groups summary
  const sealedCount = groups.filter((g: any) => g.sealed).length;
  const openedCount = groups.filter((g: any) => !g.sealed && g.groupType === 'OPENED_PRODUCT').length;
  const groupTotalValue = groups.reduce((s: number, g: any) => s + (g.estimatedValue || 0), 0);

  return NextResponse.json({
    summary: {
      totalItems, totalValue, totalInvested, unrealizedGL, realizedGL, roi: Math.round(roi * 10) / 10,
      gradedCount, rawCount, activeListings, totalSoldValue, sealedCount, openedCount, groupTotalValue,
      totalGroups: groups.length,
    },
    byCategory, bySport, byManufacturer, byStatus, byStorage, byGradeCompany,
    topItems, topGroups, timeline,
  });
}
