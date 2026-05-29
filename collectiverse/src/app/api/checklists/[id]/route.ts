import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const checklist = await (prisma as any).checklist.findUnique({
    where: { id: params.id },
    include: {
      cards: { orderBy: { sequenceNumber: 'asc' } },
      parallels: { orderBy: { name: 'asc' } },
      inserts: { orderBy: { name: 'asc' } },
    },
  });

  if (!checklist) return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });

  // Get user's owned cards for completion calculation
  let ownedCardIds: string[] = [];
  try {
    const session = await getSession();
    if (session) {
      const { ensureUserId } = await import('@/lib/auth');
      const userId = await ensureUserId(session);
      const checklistCardIds = checklist.cards.map((c: any) => c.cardId).filter(Boolean);
      if (checklistCardIds.length > 0) {
        const owned = await (prisma as any).inventoryItem.findMany({
          where: { userId, cardId: { in: checklistCardIds }, status: { not: 'SOLD' } },
          select: { cardId: true },
        });
        ownedCardIds = owned.map((o: any) => o.cardId);
      }
    }
  } catch {}

  const totalCards = checklist.cards.length || checklist.totalCards;
  const ownedCount = ownedCardIds.length;
  const missingCount = totalCards - ownedCount;
  const completionPct = totalCards > 0 ? Math.round((ownedCount / totalCards) * 1000) / 10 : 0;

  return NextResponse.json({
    checklist,
    completion: { total: totalCards, owned: ownedCount, missing: missingCount, percent: completionPct },
    ownedCardIds,
  });
}
