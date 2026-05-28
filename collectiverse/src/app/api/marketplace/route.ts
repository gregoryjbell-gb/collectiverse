import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'));
  const pageSize = Math.min(50, parseInt(req.nextUrl.searchParams.get('pageSize') || '25'));
  const q = req.nextUrl.searchParams.get('q');

  const where: any = { status: 'ACTIVE' };
  if (q) where.description = { contains: q, mode: 'insensitive' };

  const [listings, total] = await Promise.all([
    (prisma as any).listing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    (prisma as any).listing.count({ where }),
  ]);

  // Enrich with safe public data
  const enriched = await Promise.all(listings.map(async (l: any) => {
    let itemData = null;
    if (l.inventoryItemId) {
      const item = await prisma.inventoryItem.findUnique({
        where: { id: l.inventoryItemId },
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
          condition: item.condition,
          gradeCompany: item.gradeCompany,
          gradeValue: item.gradeValue,
          frontImageUrl: item.card.frontImageUrl,
        };
      }
    }
    if (l.inventoryGroupId) {
      const group = await (prisma as any).inventoryGroup.findUnique({
        where: { id: l.inventoryGroupId },
        include: { cardSet: { select: { name: true, year: true } } },
      });
      if (group) {
        itemData = { name: group.name, groupType: group.groupType, sealed: group.sealed, cardSet: group.cardSet };
      }
    }

    // Get seller display name
    const seller = await prisma.user.findUnique({ where: { id: l.userId }, select: { displayName: true, username: true } });

    return {
      id: l.id,
      listingType: l.listingType,
      price: l.price,
      allowOffers: l.allowOffers,
      allowTrades: l.allowTrades,
      description: l.description,
      shippingNotes: l.shippingNotes,
      createdAt: l.createdAt,
      seller: seller?.displayName || seller?.username || 'Seller',
      item: itemData,
    };
  }));

  return NextResponse.json({ listings: enriched, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
}
