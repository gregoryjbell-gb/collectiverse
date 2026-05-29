import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const sale = await (prisma as any).sale.findUnique({ where: { id: params.id } });
  if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });

  // Only buyer, seller, or admin can view
  if (sale.sellerUserId !== userId && sale.buyerUserId !== userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch related data (without exposing private fields)
  let listing = null;
  let offer = null;
  let payment = null;
  let shipment = null;
  let transfer = null;
  let item = null;
  let group = null;
  let sellerUser = null;
  let buyerUser = null;

  if (sale.listingId) {
    listing = await (prisma as any).listing.findUnique({ where: { id: sale.listingId } });
  }
  if (sale.offerId) {
    offer = await (prisma as any).offer.findUnique({ where: { id: sale.offerId } });
  }
  if (sale.paymentId) {
    payment = await (prisma as any).paymentIntent.findUnique({ where: { id: sale.paymentId } });
  }
  if (sale.shipmentId) {
    shipment = await (prisma as any).shipment.findUnique({ where: { id: sale.shipmentId } });
  }
  if (sale.transferId) {
    transfer = await (prisma as any).ownershipTransfer.findUnique({ where: { id: sale.transferId } });
  }
  if (sale.inventoryItemId) {
    const raw = await (prisma as any).inventoryItem.findUnique({
      where: { id: sale.inventoryItemId },
      include: { card: { include: { person: true, set: true } } },
    });
    if (raw) {
      item = {
        id: raw.id,
        condition: raw.condition,
        gradeCompany: raw.gradeCompany,
        gradeValue: raw.gradeValue,
        estimatedValue: raw.estimatedValue,
        askingPrice: raw.askingPrice,
        status: raw.status,
        cardName: raw.card?.person?.displayName || raw.card?.characterName || 'Unknown',
        setName: raw.card?.set?.name || '',
        cardNumber: raw.card?.cardNumber || '',
      };
    }
  }
  if (sale.inventoryGroupId) {
    const raw = await (prisma as any).inventoryGroup.findUnique({ where: { id: sale.inventoryGroupId } });
    if (raw) {
      group = {
        id: raw.id,
        name: raw.name,
        groupType: raw.groupType,
        estimatedValue: raw.estimatedValue,
        askingPrice: raw.askingPrice,
        status: raw.status,
      };
    }
  }

  sellerUser = await (prisma as any).user.findUnique({
    where: { id: sale.sellerUserId },
    select: { id: true, username: true, displayName: true },
  });
  if (sale.buyerUserId) {
    buyerUser = await (prisma as any).user.findUnique({
      where: { id: sale.buyerUserId },
      select: { id: true, username: true, displayName: true },
    });
  }

  return NextResponse.json({
    sale,
    listing,
    offer,
    payment,
    shipment,
    transfer,
    item,
    group,
    seller: sellerUser,
    buyer: buyerUser,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const sale = await (prisma as any).sale.findUnique({ where: { id: params.id } });
  if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
  if (sale.sellerUserId !== userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const allowedFields = ['salePrice', 'shippingPrice', 'taxAmount', 'totalAmount'];
  const data: any = {};
  for (const key of allowedFields) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  const updated = await (prisma as any).sale.update({ where: { id: params.id }, data });
  return NextResponse.json({ sale: updated });
}
