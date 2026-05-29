import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  // Try by ID first, then by slug
  let collectible = await (prisma as any).collectible.findUnique({ where: { id: params.id } });
  if (!collectible) collectible = await (prisma as any).collectible.findUnique({ where: { slug: params.id } });
  if (!collectible) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Fetch type-specific public details (no private data)
  let details = null;
  if (collectible.cardId) {
    details = await (prisma as any).card.findUnique({
      where: { id: collectible.cardId },
      select: { id: true, cardNumber: true, year: true, parallel: true, rookie: true, autograph: true, relic: true, cardCategory: true, franchise: true, characterName: true, person: { select: { displayName: true } }, set: { select: { name: true, year: true, manufacturer: true } }, team: { select: { name: true } } },
    });
  }
  if (collectible.comicIssueId) {
    details = await (prisma as any).comicIssue.findUnique({
      where: { id: collectible.comicIssueId },
      select: { id: true, issueNumber: true, title: true, writer: true, artist: true, coverArtist: true, keyIssue: true, firstAppearance: true, variantCover: true, variantName: true, coverDate: true, comicSeries: { select: { title: true, publisher: { select: { name: true } } } } },
    });
  }

  // Related items (same type + manufacturer or franchise, limit 6)
  const related = await (prisma as any).collectible.findMany({
    where: { id: { not: collectible.id }, collectibleType: collectible.collectibleType, status: 'ACTIVE', OR: [{ manufacturer: collectible.manufacturer }, { franchise: collectible.franchise }].filter((f: any) => Object.values(f)[0]) },
    select: { id: true, title: true, subtitle: true, collectibleType: true, year: true, primaryImageUrl: true, slug: true },
    take: 6,
  });

  return NextResponse.json({
    item: {
      id: collectible.id, slug: collectible.slug, collectibleType: collectible.collectibleType,
      title: collectible.title, subtitle: collectible.subtitle, year: collectible.year,
      manufacturer: collectible.manufacturer, franchise: collectible.franchise,
      primaryImageUrl: collectible.primaryImageUrl, publicSummary: collectible.publicSummary,
      publicImageAttribution: collectible.publicImageAttribution, sourceUrl: collectible.sourceUrl,
      marketLow: collectible.marketLow, marketHigh: collectible.marketHigh, marketLastUpdatedAt: collectible.marketLastUpdatedAt,
    },
    details,
    related,
  });
}
