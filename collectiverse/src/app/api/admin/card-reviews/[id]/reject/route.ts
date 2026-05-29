import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const adminId = await ensureUserId(session);

  const body = await req.json().catch(() => ({}));

  const review = await (prisma as any).publicCardReview.findUnique({ where: { id: params.id } });
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  // Check if card has linked inventory
  const inventoryCount = await (prisma as any).inventoryItem.count({ where: { cardId: review.cardId } });

  if (inventoryCount > 0) {
    // Cannot delete — mark as rejected, inventory needs remapping
    await (prisma as any).card.update({
      where: { id: review.cardId },
      data: { publicDataStatus: 'REJECTED' },
    });
  } else {
    // Safe to delete the provisional card
    await (prisma as any).cardIdentity.deleteMany({ where: { canonicalCardId: review.cardId } }).catch(() => {});
    await (prisma as any).cardSource.deleteMany({ where: { cardId: review.cardId } }).catch(() => {});
    await (prisma as any).cardFact.deleteMany({ where: { cardId: review.cardId } }).catch(() => {});
    await (prisma as any).card.delete({ where: { id: review.cardId } }).catch(() => {});
  }

  await (prisma as any).publicCardReview.update({
    where: { id: params.id },
    data: { status: 'REJECTED', reviewerAdminId: adminId, adminNotes: body.notes || null, reviewedAt: new Date() },
  });

  return NextResponse.json({ success: true, deleted: inventoryCount === 0, hasInventory: inventoryCount > 0 });
}
