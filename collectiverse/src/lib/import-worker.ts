import { prisma } from './prisma';
import { checkExistingCard, findOrCreateIdentity, recordCardSource } from './card-fingerprint';

const CHUNK_SIZE = 250;

/**
 * Run an import job in chunked background processing.
 */
export async function runImportJob(queueJobId: string): Promise<void> {
  const queueJob = await (prisma as any).importQueueJob.findUnique({ where: { id: queueJobId } });
  if (!queueJob) throw new Error('Queue job not found');

  const importJob = await (prisma as any).importJob.findUnique({
    where: { id: queueJob.importJobId },
    include: { connector: true },
  });
  if (!importJob) throw new Error('Import job not found');

  // Mark as running
  await (prisma as any).importQueueJob.update({
    where: { id: queueJobId },
    data: { status: 'RUNNING', startedAt: new Date() },
  });

  try {
    if (queueJob.jobType === 'IMPORT') {
      await processImportRows(queueJobId, importJob);
    } else if (queueJob.jobType === 'PREVIEW') {
      await processPreviewRows(queueJobId, importJob);
    } else if (queueJob.jobType === 'VALIDATE') {
      await processValidation(queueJobId, importJob);
    }
  } catch (err: any) {
    await markImportJobFailed(queueJobId, err.message || 'Unknown error');
  }
}

/**
 * Process import rows in chunks.
 */
async function processImportRows(queueJobId: string, importJob: any): Promise<void> {
  const previewData = importJob.previewData ? JSON.parse(importJob.previewData) : [];
  // In production, you'd read from stored file. For now, use preview data as full dataset.
  const rows = previewData;
  const totalRows = rows.length;

  await (prisma as any).importQueueJob.update({
    where: { id: queueJobId },
    data: { totalRows },
  });

  const config = importJob.connector?.configJson ? JSON.parse(importJob.connector.configJson) : {};
  const sourceName = config.sourceName || importJob.connector?.name || 'Import';

  // Ensure sport exists
  const sportName = rows[0]?.sport || 'Unknown';
  let sport = await (prisma as any).sport.findFirst({ where: { name: sportName } });
  if (!sport) sport = await (prisma as any).sport.create({ data: { name: sportName } });

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

  let processedRows = 0;
  let validRows = 0;
  let duplicateRows = 0;
  let errorRows = 0;
  const errors: string[] = [];
  const createdCardIds: string[] = [];
  const createdPersonIds: string[] = [];

  // Process in chunks
  for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
    // Check if cancelled
    const currentJob = await (prisma as any).importQueueJob.findUnique({ where: { id: queueJobId } });
    if (currentJob?.status === 'CANCELLED') return;

    const chunk = rows.slice(i, i + CHUNK_SIZE);

    for (const row of chunk) {
      try {
        if (!row.subjectName || !row.cardNumber) {
          errorRows++;
          errors.push(`Row ${processedRows + 1}: Missing subjectName or cardNumber`);
          processedRows++;
          continue;
        }

        // Check fingerprint for existing card
        const existingCardId = await checkExistingCard({
          year: row.year, manufacturer: row.manufacturer, setName: row.setName,
          cardNumber: row.cardNumber, subjectName: row.subjectName,
          parallel: row.parallel, variation: row.variation,
        });

        if (existingCardId) {
          // Attach source to existing card
          await recordCardSource({ cardId: existingCardId, sourceName, sourceUrl: row.sourceUrl });
          duplicateRows++;
          processedRows++;
          continue;
        }

        // Find or create person
        let person = await (prisma as any).person.findFirst({ where: { displayName: row.subjectName } });
        if (!person) {
          person = await (prisma as any).person.create({ data: { displayName: row.subjectName, subjectType: 'ATHLETE' } });
          createdPersonIds.push(person.id);
          await (prisma as any).personSport.create({ data: { personId: person.id, sportId: sport.id } }).catch(() => {});
        }

        // Find or create team
        let team = null;
        if (row.team) {
          team = await (prisma as any).team.findFirst({ where: { name: row.team } });
          if (!team) team = await (prisma as any).team.create({ data: { name: row.team, sportId: sport.id } });
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

        // Create identity
        await findOrCreateIdentity({
          cardId: card.id, year: parseInt(row.year) || null,
          manufacturer: row.manufacturer, setName: row.setName,
          cardNumber: row.cardNumber, subjectName: row.subjectName,
          parallel: row.parallel, variation: row.variation,
        }).catch(() => {});

        // Record source
        await recordCardSource({ cardId: card.id, sourceName, sourceUrl: row.sourceUrl });

        validRows++;
      } catch (err: any) {
        errorRows++;
        errors.push(`Row ${processedRows + 1}: ${err.message}`);
      }
      processedRows++;
    }

    // Update progress
    await updateImportProgress(queueJobId, processedRows, totalRows);
  }

  // Mark completed
  await (prisma as any).importQueueJob.update({
    where: { id: queueJobId },
    data: { status: 'COMPLETED', completedAt: new Date(), processedRows, progressPercent: 100 },
  });

  // Update the import job
  await (prisma as any).importJob.update({
    where: { id: importJob.id },
    data: { status: 'IMPORTED', validRecords: validRows, duplicateRecords: duplicateRows, errorRecords: errorRows, completedAt: new Date(), errors: errors.length > 0 ? JSON.stringify(errors.slice(0, 100)) : null },
  });
}

/**
 * Process preview/validation without committing.
 */
async function processPreviewRows(queueJobId: string, importJob: any): Promise<void> {
  const previewData = importJob.previewData ? JSON.parse(importJob.previewData) : [];
  const totalRows = previewData.length;
  let processedRows = 0;
  let validRows = 0;
  let duplicateRows = 0;
  let errorRows = 0;

  await (prisma as any).importQueueJob.update({ where: { id: queueJobId }, data: { totalRows } });

  for (const row of previewData) {
    if (!row.subjectName || !row.cardNumber) { errorRows++; }
    else {
      const existing = await checkExistingCard({
        year: row.year, manufacturer: row.manufacturer, setName: row.setName,
        cardNumber: row.cardNumber, subjectName: row.subjectName,
        parallel: row.parallel, variation: row.variation,
      });
      if (existing) duplicateRows++;
      else validRows++;
    }
    processedRows++;
    if (processedRows % 50 === 0) await updateImportProgress(queueJobId, processedRows, totalRows);
  }

  await (prisma as any).importQueueJob.update({
    where: { id: queueJobId },
    data: { status: 'COMPLETED', completedAt: new Date(), processedRows, progressPercent: 100 },
  });

  await (prisma as any).importJob.update({
    where: { id: importJob.id },
    data: { status: 'PREVIEW_READY', validRecords: validRows, duplicateRecords: duplicateRows, errorRecords: errorRows },
  });
}

/**
 * Validate rows without any DB writes.
 */
async function processValidation(queueJobId: string, importJob: any): Promise<void> {
  const previewData = importJob.previewData ? JSON.parse(importJob.previewData) : [];
  const totalRows = previewData.length;
  let errorRows = 0;
  const errors: string[] = [];

  for (let i = 0; i < previewData.length; i++) {
    const row = previewData[i];
    if (!row.subjectName) errors.push(`Row ${i + 1}: Missing subjectName`);
    if (!row.cardNumber) errors.push(`Row ${i + 1}: Missing cardNumber`);
    if (!row.year) errors.push(`Row ${i + 1}: Missing year`);
    if (errors.length > (errorRows * 3)) errorRows++;
  }

  await (prisma as any).importQueueJob.update({
    where: { id: queueJobId },
    data: { status: 'COMPLETED', completedAt: new Date(), processedRows: totalRows, totalRows, progressPercent: 100, errorMessage: errors.length > 0 ? JSON.stringify(errors.slice(0, 50)) : null },
  });
}

/**
 * Update progress for a running job.
 */
export async function updateImportProgress(queueJobId: string, processedRows: number, totalRows: number): Promise<void> {
  const percent = totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0;
  await (prisma as any).importQueueJob.update({
    where: { id: queueJobId },
    data: { processedRows, progressPercent: percent },
  });
}

/**
 * Mark a job as failed.
 */
export async function markImportJobFailed(queueJobId: string, error: string): Promise<void> {
  await (prisma as any).importQueueJob.update({
    where: { id: queueJobId },
    data: { status: 'FAILED', errorMessage: error, completedAt: new Date() },
  });
}
