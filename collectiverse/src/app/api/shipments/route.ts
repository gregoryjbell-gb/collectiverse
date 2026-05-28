import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const shipments = await (prisma as any).shipment.findMany({
    where: { OR: [{ sellerUserId: userId }, { buyerUserId: userId }] },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ shipments });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const { buyerUserId, listingId, offerId, transferId, carrier, trackingNumber, trackingUrl, notes } = await req.json();
  if (!buyerUserId || !carrier) return NextResponse.json({ error: 'buyerUserId and carrier required' }, { status: 400 });

  const shipment = await (prisma as any).shipment.create({
    data: {
      sellerUserId: userId,
      buyerUserId,
      listingId: listingId || null,
      offerId: offerId || null,
      transferId: transferId || null,
      carrier,
      trackingNumber: trackingNumber || null,
      trackingUrl: trackingUrl || null,
      shippingStatus: trackingNumber ? 'SHIPPED' : 'LABEL_CREATED',
      shippedAt: trackingNumber ? new Date() : null,
      notes: notes || null,
    },
  });

  await createNotification({ userId: buyerUserId, type: 'SYSTEM', title: 'Shipment Created', message: `Your item has been shipped via ${carrier}.${trackingNumber ? ` Tracking: ${trackingNumber}` : ''}`, entityType: 'SHIPMENT', entityId: shipment.id });

  return NextResponse.json({ shipment }, { status: 201 });
}
