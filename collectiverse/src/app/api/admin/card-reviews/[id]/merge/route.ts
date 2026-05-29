import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit-log';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const adminId = await ensureUserId(session);

  const body = await req.json();
  const { canonicalCardId, notes } = body;

  if (!canonicalCardId) return NextResponse.json({ error: 'canonicalCardId is required' }, { status: 400 });

  const review = await (prisma as any).publicCardReview.findUnique({ where: { id: params.id } });
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  const provisionalCardId = review.cardId;
  if (provisionalCardId === canonicalCardId) {
    return NextResponse.json({ error: 'Cannot merge card into itself' }, { status: 400 });
  }

  // Move all inventory items from provisional to canonical
  const movedInventory = await (prisma as any).inventoryItem.updateMany({
    where: { cardId: provisionalCardId },
    data: { cardId: canonicalCardId },
  });

  // Move grades
  await (prisma as any).grade.updateMany({ where: { cardId: provisionalCardId }, data: { cardId: canonicalCardId } }).catch(() => {});

  // Move QR scans
  await (prisma as any).qrScan.updateMany({ where: { cardId: provisionalCardId }, data: { cardId: canonicalCardId } }).catch(() => {});

  // Move transactions
  await (prisma as any).transaction.updateMany({ where: { cardId: provisionalCardId }, data: { cardId: canonicalCardId } }).catch(() => {});

  // Clean up provisional card
  await (prisma as any).cardIdentity.deleteMany({ where: { canonicalCardId: provisionalCardId } }).catch(() => {});
  await (prisma as any).cardSource.deleteMany({ where: { cardId: provisionalCardId } }).catch(() => {});
  await (prisma as any).cardFact.deleteMany({ where: { cardId: provisionalCardId } }).catch(() => {});
  await (prisma as any).collectionCard.deleteMany({ where: { cardId: provisionalCardId } }).catch(() => {});
  await (prisma as any).cardMedia.deleteMany({ where: { cardId: provisionalCardId } }).catch(() => {});
  await (prisma as any).cardImage.deleteMany({ where: { cardId: provisionalCardId } }).catch(() => {});
  await (prisma as any).card.delete({ where: { id: provisionalCardId } }).catch(() => {});

  // Update review
  await (prisma as any).publicCardReview.update({
    where: { id: params.id },
    data: { status: 'MERGED', reviewerAdminId: adminId, duplicateOfCardId: canonicalCardId, adminNotes: notes || null, reviewedAt: new Date() },
  });

  // Audit log
  await createAuditLog({
    actorUserId: adminId,
    entityType: 'CARD',
    entityId: canonicalCardId,
    action: 'UPDATED',
    after: { mergedFrom: provisionalCardId, movedInventory: movedInventory.count },
    notes: `Merged user-imported card into canonical via review`,
  });

  return NextResponse.json({ success: true, movedInventory: movedInventory.count, canonicalCardId });
}
