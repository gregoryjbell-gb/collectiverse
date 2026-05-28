import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const group = await (prisma as any).inventoryGroup.findFirst({
    where: { id: params.id, userId },
    select: { cardSetId: true },
  });
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!group.cardSetId) return NextResponse.json({ error: 'Group is not linked to a card set' }, { status: 400 });

  // Get all cards in the linked set
  const setCards = await prisma.card.findMany({
    where: { setId: group.cardSetId },
    select: { id: true, cardNumber: true, person: { select: { displayName: true } }, parallel: true },
    orderBy: { cardNumber: 'asc' },
  });

  // Get items in this group
  const groupItems = await (prisma as any).inventoryGroupItem.findMany({
    where: { inventoryGroupId: params.id },
    select: { inventoryItem: { select: { cardId: true, quantity: true } }, quantity: true },
  });

  const ownedCardIds = new Set(groupItems.map((gi: any) => gi.inventoryItem.cardId));
  const ownedCounts: Record<string, number> = {};
  for (const gi of groupItems) {
    const cardId = gi.inventoryItem.cardId;
    ownedCounts[cardId] = (ownedCounts[cardId] || 0) + gi.quantity;
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
    cardSetId: group.cardSetId, totalCards, ownedUniqueCards, missingCards, duplicates, completionPercent, owned, missing, duplicatesList,
  });
}
