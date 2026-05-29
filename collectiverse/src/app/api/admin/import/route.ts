import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const batches = await (prisma as any).importBatch.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ batches });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const { csvData, sourceName, sourceType, permissionStatus, fileName } = body;

  if (!csvData || !sourceName) {
    return NextResponse.json({ error: 'csvData and sourceName are required' }, { status: 400 });
  }

  // Parse CSV
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map((h: string) => h.trim());
  const rows = lines.slice(1).map((line: string) => {
    const values = parseCSVLine(line);
    const row: any = {};
    headers.forEach((h: string, i: number) => { row[h] = values[i]?.trim() || ''; });
    return row;
  });

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No data rows found' }, { status: 400 });
  }

  // Create batch record
  const batch = await (prisma as any).importBatch.create({
    data: {
      userId,
      sourceName: sourceName || 'Unknown',
      sourceType: sourceType || 'PUBLIC_CHECKLIST',
      permissionStatus: permissionStatus || 'PUBLIC_FACTS_ONLY',
      fileName: fileName || null,
      totalRows: rows.length,
      status: 'PROCESSING',
    },
  });

  try {
    const createdCardIds: string[] = [];
    const createdPersonIds: string[] = [];
    let importedRows = 0;
    let skippedRows = 0;
    const errors: string[] = [];

    // Ensure sport exists
    const sportName = rows[0]?.sport || 'Football';
    let sport = await (prisma as any).sport.findFirst({ where: { name: sportName } });
    if (!sport) {
      sport = await (prisma as any).sport.create({ data: { name: sportName } });
    }

    // Ensure card set exists
    const setName = rows[0]?.setName || rows[0]?.product || 'Unknown Set';
    const setYear = parseInt(rows[0]?.year) || 2000;
    const manufacturer = rows[0]?.manufacturer || '';
    let cardSet = await (prisma as any).cardSet.findFirst({ where: { name: setName, year: setYear } });
    if (!cardSet) {
      cardSet = await (prisma as any).cardSet.create({
        data: { name: setName, year: setYear, manufacturer, sportId: sport.id },
      });
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.subjectName || !row.cardNumber) {
          skippedRows++;
          errors.push(`Row ${i + 2}: Missing subjectName or cardNumber`);
          continue;
        }

        // Find or create person
        let person = await (prisma as any).person.findFirst({
          where: { displayName: row.subjectName },
        });
        if (!person) {
          person = await (prisma as any).person.create({
            data: { displayName: row.subjectName, subjectType: 'ATHLETE' },
          });
          createdPersonIds.push(person.id);

          // Link person to sport
          await (prisma as any).personSport.create({
            data: { personId: person.id, sportId: sport.id },
          }).catch(() => {}); // ignore if already exists
        }

        // Find or create team
        let team = null;
        if (row.team) {
          team = await (prisma as any).team.findFirst({ where: { name: row.team } });
          if (!team) {
            team = await (prisma as any).team.create({
              data: { name: row.team, sportId: sport.id },
            });
          }
        }

        // Check for duplicate card
        const existingCard = await (prisma as any).card.findFirst({
          where: { personId: person.id, setId: cardSet.id, cardNumber: row.cardNumber },
        });
        if (existingCard) {
          skippedRows++;
          continue;
        }

        // Create card
        const card = await (prisma as any).card.create({
          data: {
            personId: person.id,
            setId: cardSet.id,
            teamId: team?.id || null,
            year: parseInt(row.year) || null,
            cardNumber: row.cardNumber,
            parallel: row.parallel || null,
            rookie: row.rookie === 'true',
            autograph: row.autograph === 'true',
            relic: row.relic === 'true',
            serialNumber: row.serialNumber || null,
            printRun: row.printRun ? parseInt(row.printRun) : null,
            cardCategory: row.cardCategory || 'SPORTS',
            collectibleType: 'SPORTS_CARD',
            status: 'hold',
          },
        });
        createdCardIds.push(card.id);
        importedRows++;
      } catch (err: any) {
        errors.push(`Row ${i + 2}: ${err.message || 'Unknown error'}`);
      }
    }

    // Update batch
    await (prisma as any).importBatch.update({
      where: { id: batch.id },
      data: {
        status: 'COMPLETED',
        importedRows,
        skippedRows,
        errorRows: errors.length,
        sportId: sport.id,
        cardSetId: cardSet.id,
        createdCardIds,
        createdPersonIds,
        errors: errors.length > 0 ? JSON.stringify(errors.slice(0, 50)) : null,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      batch: { ...batch, status: 'COMPLETED', importedRows, skippedRows, errorRows: errors.length },
      sport,
      cardSet,
      createdCards: importedRows,
      createdPersons: createdPersonIds.length,
      errors: errors.slice(0, 20),
    }, { status: 201 });
  } catch (err: any) {
    await (prisma as any).importBatch.update({
      where: { id: batch.id },
      data: { status: 'FAILED', errors: JSON.stringify([err.message]) },
    });
    return NextResponse.json({ error: err.message || 'Import failed' }, { status: 500 });
  }
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
