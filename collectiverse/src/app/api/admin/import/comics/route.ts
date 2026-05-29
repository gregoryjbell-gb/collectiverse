import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const { csvData, sourceName, sourceType, permissionStatus } = body;
  if (!csvData) return NextResponse.json({ error: 'csvData required' }, { status: 400 });

  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map((h: string) => h.trim());
  const rows = lines.slice(1).map((line: string) => {
    const values = parseCSVLine(line);
    const row: any = {};
    headers.forEach((h: string, i: number) => { row[h] = values[i]?.trim() || ''; });
    return row;
  });

  // Create batch
  const batch = await (prisma as any).importBatch.create({
    data: { userId, sourceName: sourceName || 'Comic Import', sourceType: sourceType || 'PUBLIC_CHECKLIST', permissionStatus: permissionStatus || 'PUBLIC_FACTS_ONLY', totalRows: rows.length, status: 'PROCESSING' },
  });

  let imported = 0, skipped = 0;
  const errors: string[] = [];
  const createdIds: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.publisher || !row.seriesTitle || !row.issueNumber) { skipped++; errors.push(`Row ${i+2}: missing publisher/series/issue`); continue; }

      // Find or create publisher
      const normPub = row.publisher.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      let publisher = await (prisma as any).comicPublisher.findUnique({ where: { normalizedName: normPub } });
      if (!publisher) publisher = await (prisma as any).comicPublisher.create({ data: { name: row.publisher, normalizedName: normPub } });

      // Find or create series
      const normTitle = row.seriesTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      let series = await (prisma as any).comicSeries.findFirst({ where: { publisherId: publisher.id, normalizedTitle: normTitle, volume: row.volume || null } });
      if (!series) series = await (prisma as any).comicSeries.create({ data: { publisherId: publisher.id, title: row.seriesTitle, normalizedTitle: normTitle, volume: row.volume || null, startYear: row.coverDate ? parseInt(row.coverDate) : null, universe: row.universe || null, genre: row.genre || null } });

      // Check duplicate: publisher + series + issueNumber + variantName
      const existing = await (prisma as any).comicIssue.findFirst({ where: { comicSeriesId: series.id, issueNumber: row.issueNumber, variantName: row.variantName || null } });
      if (existing) { skipped++; continue; }

      // Create Collectible
      const title = `${row.seriesTitle} #${row.issueNumber}`;
      const collectible = await (prisma as any).collectible.create({
        data: { collectibleType: 'COMIC_BOOK', title, subtitle: row.issueTitle || null, year: row.coverDate ? parseInt(row.coverDate) : null, manufacturer: row.publisher, franchise: row.universe || null, status: 'ACTIVE' },
      });

      // Create ComicIssue
      const issue = await (prisma as any).comicIssue.create({
        data: {
          collectibleId: collectible.id, comicSeriesId: series.id, publisherId: publisher.id,
          issueNumber: row.issueNumber, title: row.issueTitle || null,
          coverDate: row.coverDate ? new Date(`${row.coverDate}-01-01`) : null,
          releaseDate: row.releaseDate ? new Date(row.releaseDate) : null,
          writer: row.writer || null, artist: row.artist || null, coverArtist: row.coverArtist || null,
          keyIssue: row.keyIssue === 'true', firstAppearance: row.firstAppearance === 'true',
          variantCover: row.variantCover === 'true', variantName: row.variantName || null,
          printRun: row.printRun ? parseInt(row.printRun) : null, upc: row.upc || null, isbn: row.isbn || null,
        },
      });

      await (prisma as any).collectible.update({ where: { id: collectible.id }, data: { comicIssueId: issue.id } });
      createdIds.push(issue.id);
      imported++;
    } catch (err: any) { errors.push(`Row ${i+2}: ${err.message}`); }
  }

  await (prisma as any).importBatch.update({ where: { id: batch.id }, data: { status: 'COMPLETED', importedRows: imported, skippedRows: skipped, errorRows: errors.length, errors: errors.length > 0 ? JSON.stringify(errors.slice(0, 50)) : null, completedAt: new Date() } });

  return NextResponse.json({ batch: { id: batch.id, imported, skipped, errors: errors.length }, createdIssues: imported }, { status: 201 });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []; let current = ''; let inQuotes = false;
  for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') inQuotes = !inQuotes; else if (ch === ',' && !inQuotes) { result.push(current); current = ''; } else current += ch; }
  result.push(current); return result;
}
