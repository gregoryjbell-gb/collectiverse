import { prisma } from './prisma';

/**
 * Check if an inventory item or group has an active reservation.
 */
export async function checkReservation(params: { inventoryItemId?: string | null; inventoryGroupId?: string | null }): Promise<any | null> {
  const { inventoryItemId, inventoryGroupId } = params;

  if (inventoryItemId) {
    const reservation = await (prisma as any).inventoryReservation.findFirst({
      where: { inventoryItemId, status: 'ACTIVE' },
    });
    if (reservation) {
      // Check if expired
      if (reservation.expiresAt && new Date() > new Date(reservation.expiresAt)) {
        await (prisma as any).inventoryReservation.update({ where: { id: reservation.id }, data: { status: 'EXPIRED', releasedAt: new Date() } });
        return null;
      }
      return reservation;
    }
  }

  if (inventoryGroupId) {
    const reservation = await (prisma as any).inventoryReservation.findFirst({
      where: { inventoryGroupId, status: 'ACTIVE' },
    });
    if (reservation) {
      if (reservation.expiresAt && new Date() > new Date(reservation.expiresAt)) {
        await (prisma as any).inventoryReservation.update({ where: { id: reservation.id }, data: { status: 'EXPIRED', releasedAt: new Date() } });
        return null;
      }
      return reservation;
    }
  }

  return null;
}

/**
 * Create a reservation for an inventory item or group.
 */
export async function createReservation(params: {
  userId: string;
  inventoryItemId?: string | null;
  inventoryGroupId?: string | null;
  reservedForType: string;
  reservedForId: string;
  expiresAt?: Date | null;
}): Promise<{ success: boolean; reservation?: any; error?: string }> {
  const { userId, inventoryItemId, inventoryGroupId, reservedForType, reservedForId, expiresAt } = params;

  // Check existing reservation
  const existing = await checkReservation({ inventoryItemId, inventoryGroupId });
  if (existing) {
    return { success: false, error: `Item is already reserved for ${existing.reservedForType} (${existing.reservedForId.slice(-8)})` };
  }

  // Verify ownership
  if (inventoryItemId) {
    const item = await (prisma as any).inventoryItem.findFirst({ where: { id: inventoryItemId, userId } });
    if (!item) return { success: false, error: 'Item not found or not yours' };
    if (item.status === 'SOLD') return { success: false, error: 'Item is already sold' };
  }
  if (inventoryGroupId) {
    const group = await (prisma as any).inventoryGroup.findFirst({ where: { id: inventoryGroupId, userId } });
    if (!group) return { success: false, error: 'Group not found or not yours' };
    if (group.status === 'SOLD') return { success: false, error: 'Group is already sold' };
  }

  const reservation = await (prisma as any).inventoryReservation.create({
    data: { userId, inventoryItemId: inventoryItemId || null, inventoryGroupId: inventoryGroupId || null, reservedForType, reservedForId, expiresAt: expiresAt || null },
  });

  return { success: true, reservation };
}

/**
 * Release a reservation.
 */
export async function releaseReservation(reservationId: string): Promise<void> {
  await (prisma as any).inventoryReservation.update({
    where: { id: reservationId },
    data: { status: 'RELEASED', releasedAt: new Date() },
  });
}

/**
 * Release all active reservations for a given entity.
 */
export async function releaseReservationsFor(reservedForType: string, reservedForId: string): Promise<number> {
  const result = await (prisma as any).inventoryReservation.updateMany({
    where: { reservedForType, reservedForId, status: 'ACTIVE' },
    data: { status: 'RELEASED', releasedAt: new Date() },
  });
  return result.count;
}

/**
 * Convert a reservation to CONVERTED (sale completed).
 */
export async function convertReservation(reservedForType: string, reservedForId: string): Promise<number> {
  const result = await (prisma as any).inventoryReservation.updateMany({
    where: { reservedForType, reservedForId, status: 'ACTIVE' },
    data: { status: 'CONVERTED', releasedAt: new Date() },
  });
  return result.count;
}

/**
 * Get reservation status for an inventory item/group (for UI display).
 */
export async function getReservationStatus(params: { inventoryItemId?: string | null; inventoryGroupId?: string | null }): Promise<{ reserved: boolean; type?: string; id?: string }> {
  const reservation = await checkReservation(params);
  if (!reservation) return { reserved: false };
  return { reserved: true, type: reservation.reservedForType, id: reservation.reservedForId };
}
