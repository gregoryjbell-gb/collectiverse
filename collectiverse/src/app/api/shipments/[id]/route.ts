import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const where: any = { id: params.id };
  if (session.role !== 'ADMIN') where.OR = [{ sellerUserId: userId }, { buyerUserId: userId }];

  const shipment = await (prisma as any).shipment.findFirst({ where });
  if (!shipment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ shipment });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const shipment = await (prisma as any).shipment.findUnique({ where: { id: params.id } });
  if (!shipment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Only seller or admin can update
  if (shipment.sellerUserId !== userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only seller can update shipment' }, { status: 403 });
  }

  const data = await req.json();
  const updateData: any = {};
  if (data.carrier) updateData.carrier = data.carrier;
  if (data.trackingNumber !== undefined) updateData.trackingNumber = data.trackingNumber || null;
  if (data.trackingUrl !== undefined) updateData.trackingUrl = data.trackingUrl || null;
  if (data.shippingStatus) {
    updateData.shippingStatus = data.shippingStatus;
    if (data.shippingStatus === 'SHIPPED' && !shipment.shippedAt) updateData.shippedAt = new Date();
    if (data.shippingStatus === 'DELIVERED') updateData.deliveredAt = new Date();
  }
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  const updated = await (prisma as any).shipment.update({ where: { id: params.id }, data: updateData });

  // Notify buyer on status change
  if (data.shippingStatus && data.shippingStatus !== shipment.shippingStatus) {
    await createNotification({ userId: shipment.buyerUserId, type: 'SYSTEM', title: 'Shipment Update', message: `Your shipment status: ${data.shippingStatus.replace(/_/g, ' ')}`, entityType: 'SHIPMENT', entityId: params.id });
  }

  return NextResponse.json({ shipment: updated });
}
