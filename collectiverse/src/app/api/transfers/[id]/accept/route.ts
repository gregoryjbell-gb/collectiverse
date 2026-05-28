import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mkdir, cp } from 'fs/promises';
import { join } from 'path';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const transfer = await (prisma as any).ownershipTransfer.findFirst({
    where: { id: params.id, toUserId: userId, status: 'PENDING' },
  });
  if (!transfer) return NextResponse.json({ error: 'Transfer not found or not pending' }, { status: 404 });

  // Transfer inventory item ownership
  if (transfer.inventoryItemId) {
    await prisma.inventoryItem.update({
      where: { id: transfer.inventoryItemId },
      data: { userId },
    });

    // Move private media to new owner's storage
    const oldDir = join(process.cwd(), 'storage', 'private', 'users', transfer.fromUserId, 'inventory', transfer.inventoryItemId);
    const newDir = join(process.cwd(), 'storage', 'private', 'users', userId, 'inventory', transfer.inventoryItemId);
    await mkdir(newDir, { recursive: true });
    try { await cp(oldDir, newDir, { recursive: true }); } catch { /* source may not exist */ }
  }

  // Transfer inventory group ownership
  if (transfer.inventoryGroupId) {
    await (prisma as any).inventoryGroup.update({
      where: { id: transfer.inventoryGroupId },
      data: { userId },
    });

    const oldDir = join(process.cwd(), 'storage', 'private', 'users', transfer.fromUserId, 'groups', transfer.inventoryGroupId);
    const newDir = join(process.cwd(), 'storage', 'private', 'users', userId, 'groups', transfer.inventoryGroupId);
    await mkdir(newDir, { recursive: true });
    try { await cp(oldDir, newDir, { recursive: true }); } catch { /* source may not exist */ }
  }

  // Update linked listing to SOLD
  if (transfer.listingId) {
    await (prisma as any).listing.update({
      where: { id: transfer.listingId },
      data: { status: 'SOLD', soldAt: new Date() },
    }).catch(() => {});
  }

  // Mark transfer as accepted
  await (prisma as any).ownershipTransfer.update({
    where: { id: params.id },
    data: { status: 'ACCEPTED', acceptedAt: new Date() },
  });

  // Audit log
  await (prisma as any).auditLog.create({
    data: {
      action: 'TRANSFER_ACCEPTED',
      entityType: transfer.inventoryItemId ? 'INVENTORY_ITEM' : 'INVENTORY_GROUP',
      entityId: transfer.inventoryItemId || transfer.inventoryGroupId || params.id,
      actorUserId: userId,
      targetUserId: transfer.fromUserId,
      notes: `Transfer accepted from ${transfer.fromUserId} to ${userId}`,
    },
  }).catch(() => {});

  return NextResponse.json({ success: true, message: 'Transfer accepted. Ownership has been transferred.' });
}
