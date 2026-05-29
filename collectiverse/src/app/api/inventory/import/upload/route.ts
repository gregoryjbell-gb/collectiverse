import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const { csvData, sourceApp, filename } = body;

  if (!csvData) return NextResponse.json({ error: 'csvData is required' }, { status: 400 });

  // Parse CSV
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map((h: string) => h.trim());
  const rows = lines.slice(1).map((line: string, i: number) => {
    const values = parseCSVLine(line);
    const row: any = {};
    headers.forEach((h: string, idx: number) => { row[h] = values[idx]?.trim() || ''; });
    return { rowNumber: i + 1, raw: row };
  });

  // Create batch
  const batch = await (prisma as any).inventoryImportBatch.create({
    data: {
      userId,
      sourceApp: sourceApp || 'GENERIC',
      filename: filename || null,
      status: 'UPLOADED',
      totalRows: rows.length,
    },
  });

  // Create rows
  for (const row of rows) {
    await (prisma as any).inventoryImportRow.create({
      data: {
        batchId: batch.id,
        rowNumber: row.rowNumber,
        rawJson: JSON.stringify(row.raw),
        status: 'NEEDS_MAPPING',
      },
    });
  }

  return NextResponse.json({ batch, headers, totalRows: rows.length, preview: rows.slice(0, 5).map((r: any) => r.raw) }, { status: 201 });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}
