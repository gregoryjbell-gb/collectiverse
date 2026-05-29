import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const {
    inventoryItemId, inventoryGroupId, itemType,
    externalPlatform, externalOrderId, externalBuyerName,
    salePrice, shippingPrice,
    externalShippingName, addressLine1, addressLine2, city, state, postalCode, country,
    carrier, trackingNumber, trackingUrl,
  } = body;

  if (!salePrice) {
    return NextResponse.json({ error: 'salePrice is required' }, { status: 400 });
  }

  const itemId = itemType === 'ITEM' ? inventoryItemId : null;
  const groupId = itemType === 'GROUP' ? inventoryGroupId : null;

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

  const totalAmount = parseFloat(salePrice) + (shippingPrice ? parseFloat(shippingPrice) : 0);

  // Create shipment if tracking provided
  let shipmentId: string | null = null;
  if (trackingNumber || carrier) {
    const shipment = await (prisma as any).shipment.create({
      data: {
        sellerUserId: userId,
        buyerUserId: userId, // external buyer, use seller as placeholder
        carrier: carrier || 'OTHER',
        trackingNumber: trackingNumber || null,
        trackingUrl: trackingUrl || null,
        shippingStatus: trackingNumber ? 'SHIPPED' : 'NOT_SHIPPED',
        shippedAt: trackingNumber ? new Date() : null,
        shippingAddressSnapshot: externalShippingAddressJson,
      },
    });
    shipmentId = shipment.id;
  }

  // Create sale
  const sale = await (prisma as any).sale.create({
    data: {
      sellerUserId: userId,
      inventoryItemId: itemId,
      inventoryGroupId: groupId,
      purchaseType: 'PRIVATE_SALE',
      status: 'COMPLETED',
      salePrice: parseFloat(salePrice),
      shippingPrice: shippingPrice ? parseFloat(shippingPrice) : null,
      totalAmount,
      shipmentId,
      soldExternally: true,
      externalPlatform: externalPlatform || null,
      externalOrderId: externalOrderId || null,
      externalBuyerName: externalBuyerName || null,
      externalShippingName: externalShippingName || null,
      externalShippingAddressJson,
      completedAt: new Date(),
    },
  });

  // Update inventory status
  if (itemId) {
    await (prisma as any).inventoryItem.update({ where: { id: itemId }, data: { status: 'SOLD' } });
    // Record transaction
    await (prisma as any).inventoryTransaction.create({
      data: {
        inventoryItemId: itemId,
        type: 'SALE',
        amount: parseFloat(salePrice),
        marketplace: externalPlatform || 'External',
        counterparty: externalBuyerName || null,
        transactionDate: new Date(),
        notes: `External sale${externalOrderId ? ` (Order: ${externalOrderId})` : ''}`,
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

  return NextResponse.json({ sale }, { status: 201 });
}
