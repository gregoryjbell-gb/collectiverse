import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { findSimilarCards, generateCardFingerprint } from '@/lib/card-fingerprint';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const review = await (prisma as any).publicCardReview.findUnique({ where: { id: params.id } });
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  const card = await (prisma as any).card.findUnique({
    where: { id: review.cardId },
    include: {
      person: { select: { id: true, displayName: true } },
      set: { select: { id: true, name: true, year: true, manufacturer: true } },
      team: { select: { id: true, name: true } },
      _count: { select: { inventoryItems: true } },
    },
  });

  // Get fingerprint
  const fingerprint = generateCardFingerprint({
    year: card?.year, manufacturer: card?.set?.manufacturer,
    setName: card?.set?.name, cardNumber: card?.cardNumber,
    subjectName: card?.person?.displayName, parallel: card?.parallel,
  });

  // Find similar existing cards
  const similar = await findSimilarCards({
    year: card?.year, manufacturer: card?.set?.manufacturer,
    setName: card?.set?.name, cardNumber: card?.cardNumber,
    subjectName: card?.person?.displayName,
  });

  // Get linked inventory count (no private data exposed)
  const inventoryCount = await (prisma as any).inventoryItem.count({ where: { cardId: review.cardId } });

  return NextResponse.json({ review, card, fingerprint, similar, inventoryCount });
}
