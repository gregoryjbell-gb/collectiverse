import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const batch = await (prisma as any).importBatch.findUnique({ where: { id: params.id } });
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  if (batch.status === 'ROLLED_BACK') return NextResponse.json({ error: 'Already rolled back' }, { status: 400 });

  let deletedCards = 0;
  let deletedPersons = 0;

  // Delete created cards
  if (batch.createdCardIds && batch.createdCardIds.length > 0) {
    const result = await (prisma as any).card.deleteMany({ where: { id: { in: batch.createdCardIds } } });
    deletedCards = result.count;
  }

  // Delete created persons (only if they have no other cards)
  if (batch.createdPersonIds && batch.createdPersonIds.length > 0) {
    for (const personId of batch.createdPersonIds) {
      const cardCount = await (prisma as any).card.count({ where: { personId } });
      if (cardCount === 0) {
        await (prisma as any).personSport.deleteMany({ where: { personId } });
        await (prisma as any).person.delete({ where: { id: personId } }).catch(() => {});
        deletedPersons++;
      }
    }
  }

  await (prisma as any).importBatch.update({
    where: { id: params.id },
    data: { status: 'ROLLED_BACK' },
  });

  return NextResponse.json({ success: true, deletedCards, deletedPersons });
}
