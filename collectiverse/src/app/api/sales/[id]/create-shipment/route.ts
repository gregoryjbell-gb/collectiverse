import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const sale = await (prisma as any).sale.findUnique({ where: { id: params.id } });
  if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
  if (sale.sellerUserId !== userId) return NextResponse.json({ error: 'Only seller can update shipment' }, { status: 403 });

  const body = await req.json();
  const { carrier, trackingNumber, trackingUrl } = body;

  if (sale.shipmentId) {
    const shipment = await (prisma as any).shipment.update({
      where: { id: sale.shipmentId },
      data: {
        carrier: carrier || 'OTHER',
        trackingNumber: trackingNumber || null,
        trackingUrl: trackingUrl || null,
        shippingStatus: trackingNumber ? 'SHIPPED' : 'LABEL_CREATED',
        shippedAt: trackingNumber ? new Date() : null,
      },
    });
    return NextResponse.json({ shipment });
  }

  const shipment = await (prisma as any).shipment.create({
    data: {
      listingId: sale.listingId,
      offerId: sale.offerId,
      sellerUserId: sale.sellerUserId,
      buyerUserId: sale.buyerUserId || '',
      carrier: carrier || 'OTHER',
      trackingNumber: trackingNumber || null,
      trackingUrl: trackingUrl || null,
      shippingStatus: trackingNumber ? 'SHIPPED' : 'LABEL_CREATED',
      shippedAt: trackingNumber ? new Date() : null,
    },
  });

  await (prisma as any).sale.update({
    where: { id: params.id },
    data: { shipmentId: shipment.id },
  });

  return NextResponse.json({ shipment });
}
