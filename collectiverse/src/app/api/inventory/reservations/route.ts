import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { createReservation } from '@/lib/inventory-reservation';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const { inventoryItemId, inventoryGroupId, reservedForType, reservedForId, expiresAt } = body;

  if (!reservedForType || !reservedForId) {
    return NextResponse.json({ error: 'reservedForType and reservedForId are required' }, { status: 400 });
  }

  const result = await createReservation({
    userId,
    inventoryItemId: inventoryItemId || null,
    inventoryGroupId: inventoryGroupId || null,
    reservedForType,
    reservedForId,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  });

  if (!result.success) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ reservation: result.reservation }, { status: 201 });
}
