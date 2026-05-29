import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit-log';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const sales = await (prisma as any).sale.findMany({
    where: { sellerUserId: userId, soldExternally: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ sales });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const {
    inventoryItemId, inventoryGroupId, itemType,
    externalPlatform, externalOrderId, externalBuyerName, externalBuyerContact,
    salePrice, shippingPrice, platformFees,
    externalSaleDate, externalNotes, paymentStatus,
    externalShippingName, addressLine1, addressLine2, city, state, postalCode, country,
    carrier, trackingNumber, trackingUrl, shippedDate,
  } = body;

  // Validation
  if (!salePrice || parseFloat(salePrice) < 0) {
    return NextResponse.json({ error: 'Sale price is required and must be >= 0' }, { status: 400 });
  }
  if (!externalPlatform) {
    return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
  }
  if (!externalSaleDate) {
    return NextResponse.json({ error: 'Sale date is required' }, { status: 400 });
  }

  const itemId = itemType === 'ITEM' ? inventoryItemId : null;
  const groupId = itemType === 'GROUP' ? inventoryGroupId : null;

  if (!itemId && !groupId) {
    return NextResponse.json({ error: 'Select an inventory item or group' }, { status: 400 });
  }

  // Validate ownership
  if (itemId) {
    const item = await (prisma as any).inventoryItem.findFirst({ where: { id: itemId, userId } });
    if (!item) return NextResponse.json({ error: 'Inventory item not found or not yours' }, { status: 404 });
  }
  if (groupId) {
    const group = await (prisma as any).inventoryGroup.findFirst({ where: { id: groupId, userId } });
    if (!group) return NextResponse.json({ error: 'Inventory group not found or not yours' }, { status: 404 });
  }

  // Build external shipping address JSON
  let externalShippingAddressJson: string | null = null;
  if (addressLine1) {
    externalShippingAddressJson = JSON.stringify({
      name: externalShippingName || externalBuyerName || '',
      addressLine1, addressLine2: addressLine2 || '',
      city: city || '', state: state || '', postalCode: postalCode || '', country: country || 'US',
    });
  }

  const salePriceNum = parseFloat(salePrice);
  const shippingPriceNum = shippingPrice ? parseFloat(shippingPrice) : 0;
  const platformFeesNum = platformFees ? parseFloat(platformFees) : 0;
  const totalAmount = salePriceNum + shippingPriceNum;

  // Create shipment if tracking provided
  let shipmentId: string | null = null;
  if (trackingNumber || (carrier && carrier !== 'NONE')) {
    const shipment = await (prisma as any).shipment.create({
      data: {
        sellerUserId: userId,
        buyerUserId: userId,
        carrier: carrier || 'OTHER',
        trackingNumber: trackingNumber || null,
        trackingUrl: trackingUrl || null,
        shippingStatus: trackingNumber ? 'SHIPPED' : 'NOT_SHIPPED',
        shippedAt: shippedDate ? new Date(shippedDate) : (trackingNumber ? new Date() : null),
        shippingAddressSnapshot: externalShippingAddressJson,
      },
    });
    shipmentId = shipment.id;
  }

  // Create PaymentIntent if marked as paid
  let paymentId: string | null = null;
  if (paymentStatus === 'PAID') {
    const payment = await (prisma as any).paymentIntent.create({
      data: {
        buyerUserId: userId,
        sellerUserId: userId,
        amount: totalAmount,
        status: 'PAID',
        provider: externalPlatform,
        paidAt: new Date(externalSaleDate),
        platformFee: platformFeesNum || null,
        sellerPayoutAmount: salePriceNum - platformFeesNum,
      },
    });
    paymentId = payment.id;
  }

  // Create sale
  const sale = await (prisma as any).sale.create({
    data: {
      sellerUserId: userId,
      inventoryItemId: itemId,
      inventoryGroupId: groupId,
      purchaseType: 'PRIVATE_SALE',
      status: 'COMPLETED',
      salePrice: salePriceNum,
      shippingPrice: shippingPriceNum || null,
      totalAmount,
      platformFees: platformFeesNum || null,
      paymentId,
      shipmentId,
      soldExternally: true,
      externalPlatform,
      externalOrderId: externalOrderId || null,
      externalBuyerName: externalBuyerName || null,
      externalBuyerContact: externalBuyerContact || null,
      externalShippingName: externalShippingName || null,
      externalShippingAddressJson,
      externalSaleDate: new Date(externalSaleDate),
      externalNotes: externalNotes || null,
      completedAt: new Date(),
    },
  });

  // Update inventory status
  if (itemId) {
    await (prisma as any).inventoryItem.update({ where: { id: itemId }, data: { status: 'SOLD' } });
    await (prisma as any).inventoryTransaction.create({
      data: {
        inventoryItemId: itemId,
        type: 'SALE',
        amount: salePriceNum,
        marketplace: externalPlatform || 'External',
        counterparty: externalBuyerName || null,
        transactionDate: new Date(externalSaleDate),
        notes: `External sale on ${externalPlatform}${externalOrderId ? ` (Order: ${externalOrderId})` : ''}`,
      },
    });
  }
  if (groupId) {
    await (prisma as any).inventoryGroup.update({ where: { id: groupId }, data: { status: 'SOLD' } });
  }

  // Update listing if one exists
  if (itemId) {
    await (prisma as any).listing.updateMany({ where: { inventoryItemId: itemId, status: { in: ['ACTIVE', 'DRAFT'] } }, data: { status: 'SOLD', soldAt: new Date() } }).catch(() => {});
  }
  if (groupId) {
    await (prisma as any).listing.updateMany({ where: { inventoryGroupId: groupId, status: { in: ['ACTIVE', 'DRAFT'] } }, data: { status: 'SOLD', soldAt: new Date() } }).catch(() => {});
  }

  // Audit log
  await createAuditLog({
    actorUserId: userId,
    entityType: itemId ? 'INVENTORY_ITEM' : 'INVENTORY_GROUP',
    entityId: itemId || groupId || sale.id,
    action: 'SOLD',
    after: { saleId: sale.id, platform: externalPlatform, price: salePriceNum },
    notes: `External sale recorded on ${externalPlatform}`,
  }).catch(() => {});

  return NextResponse.json({ sale }, { status: 201 });
}
