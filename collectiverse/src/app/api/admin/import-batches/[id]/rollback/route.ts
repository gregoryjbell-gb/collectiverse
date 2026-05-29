import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit-log';

// Deletion order (children first)
const DELETION_ORDER = [
  'CARD_FACT', 'CARD_SOURCE', 'CARD_IDENTITY', 'CHECKLIST_CARD',
  'CHECKLIST', 'CARD', 'CARD_SET', 'PRODUCT_RELEASE', 'CHECKLIST_SECTION',
  'BRAND', 'MANUFACTURER', 'TEAM', 'PERSON', 'SPORT',
];

const ENTITY_MODEL_MAP: Record<string, string> = {
  CARD: 'card', PERSON: 'person', TEAM: 'team', SPORT: 'sport',
  CARD_SET: 'cardSet', MANUFACTURER: 'manufacturer', BRAND: 'brand',
  PRODUCT_RELEASE: 'productRelease', CHECKLIST: 'checklist',
  CHECKLIST_CARD: 'checklistCard', CHECKLIST_SECTION: 'checklistSection',
  CARD_IDENTITY: 'cardIdentity', CARD_FACT: 'cardFact', CARD_SOURCE: 'cardSource',
};

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const batch = await (prisma as any).importBatch.findUnique({ where: { id: params.id } });
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

  // Get all created records for this batch
  const createdRecords = await (prisma as any).importCreatedRecord.findMany({
    where: { importBatchId: params.id },
    orderBy: { createdAt: 'desc' },
  });

  // Check which records can be safely deleted
  const safeToDelete: any[] = [];
  const cannotDelete: any[] = [];

  for (const record of createdRecords) {
    const hasUserData = await checkUserData(record.entityType, record.entityId);
    if (hasUserData) {
      cannotDelete.push({ ...record, reason: 'Has user inventory, listings, or transactions' });
    } else {
      safeToDelete.push(record);
    }
  }

  // Group by entity type for summary
  const summary: Record<string, { safe: number; blocked: number }> = {};
  for (const r of safeToDelete) {
    if (!summary[r.entityType]) summary[r.entityType] = { safe: 0, blocked: 0 };
    summary[r.entityType].safe++;
  }
  for (const r of cannotDelete) {
    if (!summary[r.entityType]) summary[r.entityType] = { safe: 0, blocked: 0 };
    summary[r.entityType].blocked++;
  }

  // Get rollback history
  const rollbacks = await (prisma as any).importRollback.findMany({
    where: { importBatchId: params.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    batch,
    totalRecords: createdRecords.length,
    safeToDelete: safeToDelete.length,
    cannotDelete: cannotDelete.length,
    blockedRecords: cannotDelete.slice(0, 20),
    summary,
    rollbacks,
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  if (body.confirmation !== 'ROLLBACK') {
    return NextResponse.json({ error: 'Type ROLLBACK to confirm' }, { status: 400 });
  }

  const batch = await (prisma as any).importBatch.findUnique({ where: { id: params.id } });
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  if (batch.status === 'ROLLED_BACK') return NextResponse.json({ error: 'Already rolled back' }, { status: 400 });

  // Create rollback record
  const rollback = await (prisma as any).importRollback.create({
    data: { importBatchId: params.id, adminUserId: userId, status: 'STARTED' },
  });

  const createdRecords = await (prisma as any).importCreatedRecord.findMany({
    where: { importBatchId: params.id },
  });

  let rolledBack = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Process in deletion order
  for (const entityType of DELETION_ORDER) {
    const records = createdRecords.filter((r: any) => r.entityType === entityType);

    for (const record of records) {
      try {
        const hasUserData = await checkUserData(record.entityType, record.entityId);
        if (hasUserData) {
          skipped++;
          continue;
        }

        const modelName = ENTITY_MODEL_MAP[record.entityType];
        if (modelName && (prisma as any)[modelName]) {
          await (prisma as any)[modelName].delete({ where: { id: record.entityId } }).catch(() => {
            // Record may already be deleted (cascade)
          });
          rolledBack++;
        }
      } catch (err: any) {
        errors.push(`${record.entityType}:${record.entityId} - ${err.message}`);
      }
    }
  }

  // Determine final status
  const finalStatus = skipped === 0 ? 'COMPLETED' : (rolledBack > 0 ? 'PARTIAL' : 'FAILED');

  await (prisma as any).importRollback.update({
    where: { id: rollback.id },
    data: {
      status: finalStatus,
      totalRecords: createdRecords.length,
      rolledBackRecords: rolledBack,
      skippedRecords: skipped,
      errorMessage: errors.length > 0 ? JSON.stringify(errors.slice(0, 50)) : null,
      completedAt: new Date(),
    },
  });

  // Update batch status
  const batchStatus = finalStatus === 'COMPLETED' ? 'ROLLED_BACK' : 'PARTIAL_ROLLBACK';
  await (prisma as any).importBatch.update({
    where: { id: params.id },
    data: { status: batchStatus },
  });

  // Audit log
  await createAuditLog({
    actorUserId: userId,
    entityType: 'CARD',
    entityId: params.id,
    action: 'DELETED',
    after: { rolledBack, skipped, errors: errors.length },
    notes: `Import rollback: ${rolledBack} deleted, ${skipped} skipped`,
  });

  return NextResponse.json({
    rollback: { ...rollback, status: finalStatus, rolledBackRecords: rolledBack, skippedRecords: skipped },
    batchStatus,
  });
}

/**
 * Check if an entity has user-owned data that prevents deletion.
 */
async function checkUserData(entityType: string, entityId: string): Promise<boolean> {
  try {
    if (entityType === 'CARD') {
      const count = await (prisma as any).inventoryItem.count({ where: { cardId: entityId } });
      if (count > 0) return true;
      const listings = await (prisma as any).listing.count({ where: { inventoryItemId: entityId } });
      if (listings > 0) return true;
    }
    if (entityType === 'PERSON') {
      // Check if person has cards with inventory
      const cards = await (prisma as any).card.findMany({ where: { personId: entityId }, select: { id: true } });
      for (const card of cards) {
        const inv = await (prisma as any).inventoryItem.count({ where: { cardId: card.id } });
        if (inv > 0) return true;
      }
    }
    if (entityType === 'CARD_SET') {
      const groups = await (prisma as any).inventoryGroup.count({ where: { cardSetId: entityId } });
      if (groups > 0) return true;
    }
  } catch {
    return false;
  }
  return false;
}
