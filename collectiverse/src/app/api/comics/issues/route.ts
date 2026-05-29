import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { comicSeriesId, issueNumber, title, publisher, coverDate, releaseDate, writer, artist, coverArtist, firstAppearance, keyIssue, variantCover, variantName, printRun, upc, isbn } = body;

  if (!comicSeriesId || !issueNumber) return NextResponse.json({ error: 'comicSeriesId and issueNumber required' }, { status: 400 });

  const issue = await (prisma as any).comicIssue.create({
    data: {
      comicSeriesId, issueNumber, title: title || null, publisher: publisher || null,
      coverDate: coverDate || null, releaseDate: releaseDate || null,
      writer: writer || null, artist: artist || null, coverArtist: coverArtist || null,
      firstAppearance: firstAppearance || false, keyIssue: keyIssue || false,
      variantCover: variantCover || false, variantName: variantName || null,
      printRun: printRun ? parseInt(printRun) : null, upc: upc || null, isbn: isbn || null,
    },
  });

  return NextResponse.json({ issue }, { status: 201 });
}
