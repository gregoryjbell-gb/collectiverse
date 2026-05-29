import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { batchId: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const batch = await (prisma as any).importBatch.findUnique({ where: { id: params.batchId } });
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

  // Fetch created cards with details
  let cards: any[] = [];
  if (batch.createdCardIds?.length > 0) {
    cards = await (prisma as any).card.findMany({
      where: { id: { in: batch.createdCardIds } },
      include: { person: { select: { id: true, displayName: true } }, set: { select: { id: true, name: true, year: true } }, team: { select: { id: true, name: true } } },
    });
  }

  // Fetch created persons
  let persons: any[] = [];
  if (batch.createdPersonIds?.length > 0) {
    persons = await (prisma as any).person.findMany({
      where: { id: { in: batch.createdPersonIds } },
      include: { _count: { select: { cards: true } } },
    });
  }

  return NextResponse.json({ batch, cards, persons, errors: batch.errors ? JSON.parse(batch.errors) : [] });
}
