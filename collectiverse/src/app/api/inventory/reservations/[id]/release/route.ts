import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { releaseReservation } from '@/lib/inventory-reservation';

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const reservation = await (prisma as any).inventoryReservation.findFirst({ where: { id: params.id, userId } });
  if (!reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  if (reservation.status !== 'ACTIVE') return NextResponse.json({ error: 'Reservation is not active' }, { status: 400 });

  await releaseReservation(params.id);
  return NextResponse.json({ success: true });
}
