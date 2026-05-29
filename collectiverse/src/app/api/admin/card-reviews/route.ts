import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const reviews = await (prisma as any).publicCardReview.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Fetch card details for each review
  const enriched = [];
  for (const review of reviews) {
    const card = await (prisma as any).card.findUnique({
      where: { id: review.cardId },
      include: {
        person: { select: { displayName: true } },
        set: { select: { name: true, year: true } },
        team: { select: { name: true } },
        _count: { select: { inventoryItems: true } },
      },
    });
    enriched.push({ ...review, card });
  }

  // Also get counts by status
  const counts = {
    pending: await (prisma as any).publicCardReview.count({ where: { status: 'PENDING' } }),
    approved: await (prisma as any).publicCardReview.count({ where: { status: 'APPROVED' } }),
    merged: await (prisma as any).publicCardReview.count({ where: { status: 'MERGED' } }),
    rejected: await (prisma as any).publicCardReview.count({ where: { status: 'REJECTED' } }),
  };

  return NextResponse.json({ reviews: enriched, counts });
}
