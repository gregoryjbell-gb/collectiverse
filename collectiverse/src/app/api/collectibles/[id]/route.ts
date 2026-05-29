import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const collectible = await (prisma as any).collectible.findUnique({ where: { id: params.id } });
  if (!collectible) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fetch type-specific details
  let details = null;
  if (collectible.cardId) {
    details = await (prisma as any).card.findUnique({
      where: { id: collectible.cardId },
      include: { person: { select: { displayName: true } }, set: { select: { name: true, year: true } }, team: { select: { name: true } } },
    });
  }
  if (collectible.comicIssueId) {
    details = await (prisma as any).comicIssue.findUnique({
      where: { id: collectible.comicIssueId },
      include: { comicSeries: true },
    });
  }

  return NextResponse.json({ collectible, details });
}
