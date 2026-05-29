import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const listing = await (prisma as any).listing.findFirst({ where: { id: params.id, status: { in: ['ACTIVE', 'RESERVED'] } } });
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  let itemData: any = null;
  if (listing.inventoryItemId) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: listing.inventoryItemId },
      include: { card: { include: { person: { select: { displayName: true } }, set: { select: { name: true, year: true, manufacturer: true } }, team: { select: { name: true } } } } },
    });
    if (item) {
      itemData = {
        playerName: item.card.person?.displayName || null,
        setName: item.card.set?.name || null,
        year: item.card.year || item.card.set?.year,
        manufacturer: item.card.set?.manufacturer || null,
        cardNumber: item.card.cardNumber,
        teamName: item.card.team?.name || null,
        rookie: item.card.rookie,
        autograph: item.card.autograph,
        parallel: item.card.parallel,
        condition: item.condition,
        gradeCompany: item.gradeCompany,
        gradeValue: item.gradeValue,
        certNumber: item.certNumber,
        frontImageUrl: item.card.frontImageUrl,
      };
    }
  }
  if (listing.inventoryGroupId) {
    const group = await (prisma as any).inventoryGroup.findUnique({
      where: { id: listing.inventoryGroupId },
      include: { cardSet: { select: { name: true, year: true, manufacturer: true } }, _count: { select: { items: true } } },
    });
    if (group) {
      itemData = { name: group.name, groupType: group.groupType, sealed: group.sealed, quantity: group.quantity, cardSet: group.cardSet, itemCount: group._count.items };
    }
  }

  const seller = await prisma.user.findUnique({ where: { id: listing.userId }, select: { displayName: true, username: true } });

  // Never expose: purchasePrice, storageLocation, notes, private scans
  return NextResponse.json({
    listing: {
      id: listing.id,
      listingType: listing.listingType,
      status: listing.status,
      price: listing.price,
      minimumOffer: listing.minimumOffer,
      allowOffers: listing.allowOffers,
      allowTrades: listing.allowTrades,
      buyNowEnabled: listing.buyNowEnabled ?? true,
      description: listing.description,
      shippingNotes: listing.shippingNotes,
      createdAt: listing.createdAt,
      sellerId: listing.userId,
      seller: seller?.displayName || seller?.username || 'Seller',
      item: itemData,
    },
  });
}
