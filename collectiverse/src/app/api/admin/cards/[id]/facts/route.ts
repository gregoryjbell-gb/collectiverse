import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const facts = await (prisma as any).cardFact.findMany({
    where: { cardId: params.id },
    include: { source: { select: { id: true, name: true, trustScore: true, sourceReliability: true } } },
    orderBy: [{ fieldName: 'asc' }, { confidenceScore: 'desc' }],
  });

  // Group by field
  const byField: Record<string, any[]> = {};
  for (const fact of facts) {
    if (!byField[fact.fieldName]) byField[fact.fieldName] = [];
    byField[fact.fieldName].push(fact);
  }

  return NextResponse.json({ facts, byField });
}
