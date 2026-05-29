import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { comicSeriesId, publisherId, issueNumber, title, coverDate, releaseDate, writer, artist, coverArtist, firstAppearance, keyIssue, variantCover, variantName, printRun, upc, isbn, synopsis } = body;

  if (!comicSeriesId || !issueNumber) return NextResponse.json({ error: 'comicSeriesId and issueNumber required' }, { status: 400 });

  // Get series for title generation
  const series = await (prisma as any).comicSeries.findUnique({ where: { id: comicSeriesId }, include: { publisher: true } });

  // Create Collectible first
  const collectibleTitle = `${series?.title || 'Comic'} #${issueNumber}`;
  const collectible = await (prisma as any).collectible.create({
    data: {
      collectibleType: 'COMIC_BOOK',
      title: collectibleTitle,
      subtitle: title || (firstAppearance ? 'First Appearance' : null),
      year: coverDate ? new Date(coverDate).getFullYear() : null,
      manufacturer: series?.publisher?.name || null,
      franchise: series?.universe || null,
      status: 'ACTIVE',
    },
  });

  const issue = await (prisma as any).comicIssue.create({
    data: {
      collectibleId: collectible.id,
      comicSeriesId,
      publisherId: publisherId || series?.publisherId || null,
      issueNumber,
      title: title || null,
      coverDate: coverDate ? new Date(coverDate) : null,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      writer: writer || null,
      artist: artist || null,
      coverArtist: coverArtist || null,
      firstAppearance: firstAppearance || false,
      keyIssue: keyIssue || false,
      variantCover: variantCover || false,
      variantName: variantName || null,
      printRun: printRun ? parseInt(printRun) : null,
      upc: upc || null,
      isbn: isbn || null,
      synopsis: synopsis || null,
    },
  });

  // Link collectible back
  await (prisma as any).collectible.update({ where: { id: collectible.id }, data: { comicIssueId: issue.id } });

  return NextResponse.json({ issue, collectible }, { status: 201 });
}
