import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const { canonicalId, mergeIds } = body;

  if (!canonicalId || !mergeIds?.length) {
    return NextResponse.json({ error: 'canonicalId and mergeIds are required' }, { status: 400 });
  }

  const canonical = await (prisma as any).card.findUnique({ where: { id: canonicalId } });
  if (!canonical) return NextResponse.json({ error: 'Canonical card not found' }, { status: 404 });

  let movedInventory = 0;
  let movedGrades = 0;

  for (const mergeId of mergeIds) {
    if (mergeId === canonicalId) continue;

    // Move inventory items to canonical card
    const invResult = await (prisma as any).inventoryItem.updateMany({
      where: { cardId: mergeId },
      data: { cardId: canonicalId },
    });
    movedInventory += invResult.count;

    // Move grades
    const gradeResult = await (prisma as any).grade.updateMany({
      where: { cardId: mergeId },
      data: { cardId: canonicalId },
    });
    movedGrades += gradeResult.count;

    // Move QR scans
    await (prisma as any).qrScan.updateMany({ where: { cardId: mergeId }, data: { cardId: canonicalId } });

    // Move card media
    await (prisma as any).cardMedia.updateMany({ where: { cardId: mergeId }, data: { cardId: canonicalId } });

    // Move card images
    await (prisma as any).cardImage.updateMany({ where: { cardId: mergeId }, data: { cardId: canonicalId } });

    // Move transactions
    await (prisma as any).transaction.updateMany({ where: { cardId: mergeId }, data: { cardId: canonicalId } });

    // Move collection cards
    await (prisma as any).collectionCard.updateMany({ where: { cardId: mergeId }, data: { cardId: canonicalId } }).catch(() => {});

    // Delete the duplicate
    await (prisma as any).card.delete({ where: { id: mergeId } });
  }

  await createAuditLog({
    actorUserId: userId,
    entityType: 'CARD',
    entityId: canonicalId,
    action: 'UPDATED',
    after: { merged: mergeIds, movedInventory, movedGrades },
    notes: `Merged ${mergeIds.length} duplicate cards into canonical`,
  });

  return NextResponse.json({ success: true, canonicalId, merged: mergeIds.length, movedInventory, movedGrades });
}
