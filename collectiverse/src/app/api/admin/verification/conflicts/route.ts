import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Find all conflicted facts grouped by card
  const conflictedFacts = await (prisma as any).cardFact.findMany({
    where: { verificationStatus: 'CONFLICTED' },
    include: { source: { select: { id: true, name: true, trustScore: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });

  // Group by cardId + fieldName
  const groups: Record<string, { cardId: string; fieldName: string; facts: any[] }> = {};
  for (const fact of conflictedFacts) {
    const key = `${fact.cardId}|${fact.fieldName}`;
    if (!groups[key]) groups[key] = { cardId: fact.cardId, fieldName: fact.fieldName, facts: [] };
    groups[key].facts.push(fact);
  }

  // Fetch card info for each conflict
  const conflicts = [];
  for (const group of Object.values(groups)) {
    const card = await (prisma as any).card.findUnique({
      where: { id: group.cardId },
      select: { id: true, cardNumber: true, year: true, person: { select: { displayName: true } }, set: { select: { name: true } } },
    });
    conflicts.push({ ...group, card });
  }

  return NextResponse.json({ conflicts });
}
