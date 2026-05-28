import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  // Get all cards in this set
  const setCards = await prisma.card.findMany({
    where: { setId: params.id },
    select: { id: true, cardNumber: true, person: { select: { displayName: true } }, parallel: true },
    orderBy: { cardNumber: 'asc' },
  });

  // Get user's inventory items for cards in this set
  const ownedItems = await prisma.inventoryItem.findMany({
    where: { userId, card: { setId: params.id } },
    select: { cardId: true, quantity: true },
  });

  const ownedCardIds = new Set(ownedItems.map(i => i.cardId));
  const ownedCounts: Record<string, number> = {};
  for (const item of ownedItems) {
    ownedCounts[item.cardId] = (ownedCounts[item.cardId] || 0) + item.quantity;
  }

  const totalCards = setCards.length;
  const ownedUniqueCards = setCards.filter(c => ownedCardIds.has(c.id)).length;
  const missingCards = totalCards - ownedUniqueCards;
  const duplicates = Object.values(ownedCounts).filter(count => count > 1).length;
  const completionPercent = totalCards > 0 ? Math.round((ownedUniqueCards / totalCards) * 1000) / 10 : 0;

  const owned = setCards.filter(c => ownedCardIds.has(c.id)).map(c => ({
    cardId: c.id, cardNumber: c.cardNumber, playerName: c.person?.displayName || '', parallel: c.parallel, quantity: ownedCounts[c.id] || 1,
  }));

  const missing = setCards.filter(c => !ownedCardIds.has(c.id)).map(c => ({
    cardId: c.id, cardNumber: c.cardNumber, playerName: c.person?.displayName || '', parallel: c.parallel,
  }));

  const duplicatesList = Object.entries(ownedCounts).filter(([, count]) => count > 1).map(([cardId, count]) => {
    const card = setCards.find(c => c.id === cardId);
    return { cardId, cardNumber: card?.cardNumber || '', playerName: card?.person?.displayName || '', quantity: count };
  });

  return NextResponse.json({
    cardSetId: params.id, totalCards, ownedUniqueCards, missingCards, duplicates, completionPercent, owned, missing, duplicatesList,
  });
}
