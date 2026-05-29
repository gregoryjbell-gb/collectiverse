import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { generateCardFingerprint, checkExistingCard } from '@/lib/card-fingerprint';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const jobs = await (prisma as any).importJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { connector: { select: { name: true, connectorType: true } } },
  });

  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { connectorId, dataSourceId, csvData, inputUrl } = body;

  if (!connectorId) return NextResponse.json({ error: 'connectorId is required' }, { status: 400 });

  const connector = await (prisma as any).importConnector.findUnique({ where: { id: connectorId } });
  if (!connector) return NextResponse.json({ error: 'Connector not found' }, { status: 404 });
  if (connector.status !== 'ACTIVE') return NextResponse.json({ error: 'Connector is not active' }, { status: 400 });

  // Parse config for field mappings
  const config = connector.configJson ? JSON.parse(connector.configJson) : {};
  const fieldMap = config.fieldMap || {};

  // Parse CSV data
  if (!csvData) return NextResponse.json({ error: 'csvData is required for CSV connectors' }, { status: 400 });

  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map((h: string) => h.trim());
  const rows = lines.slice(1).map((line: string) => {
    const values = parseCSVLine(line);
    const row: any = {};
    headers.forEach((h: string, i: number) => { row[h] = values[i]?.trim() || ''; });
    return row;
  });

  // Apply field mappings
  const mappedRows = rows.map((row: any) => {
    const mapped: any = {};
    for (const [targetField, sourceField] of Object.entries(fieldMap)) {
      mapped[targetField] = row[sourceField as string] || '';
    }
    // Also include unmapped fields that match target names directly
    for (const key of Object.keys(row)) {
      if (!mapped[key] && row[key]) mapped[key] = row[key];
    }
    return mapped;
  });

  // Analyze records: check fingerprints for duplicates
  let validRecords = 0;
  let duplicateRecords = 0;
  let conflictedRecords = 0;
  let errorRecords = 0;

  for (const row of mappedRows) {
    if (!row.subjectName || !row.cardNumber) { errorRecords++; continue; }
    const existingId = await checkExistingCard({
      year: row.year, manufacturer: row.manufacturer, setName: row.setName,
      cardNumber: row.cardNumber, subjectName: row.subjectName,
      parallel: row.parallel, variation: row.variation,
    });
    if (existingId) { duplicateRecords++; }
    else { validRecords++; }
  }

  const job = await (prisma as any).importJob.create({
    data: {
      connectorId,
      dataSourceId: dataSourceId || connector.defaultDataSourceId || null,
      status: 'PREVIEW_READY',
      inputUrl: inputUrl || null,
      totalRecords: mappedRows.length,
      validRecords,
      duplicateRecords,
      conflictedRecords,
      errorRecords,
      previewData: JSON.stringify(mappedRows.slice(0, 10)),
      startedAt: new Date(),
    },
  });

  return NextResponse.json({ job, preview: mappedRows.slice(0, 10), stats: { total: mappedRows.length, valid: validRecords, duplicates: duplicateRecords, errors: errorRecords } }, { status: 201 });
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
