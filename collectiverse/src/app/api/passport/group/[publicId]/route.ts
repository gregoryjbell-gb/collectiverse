import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { publicId: string } }) {
  const group = await (prisma as any).inventoryGroup.findFirst({
    where: { publicId: params.publicId, passportEnabled: true },
    include: {
      cardSet: { select: { name: true, year: true, manufacturer: true } },
      _count: { select: { items: true } },
    },
  });

  if (!group) return NextResponse.json({ error: 'Passport not found' }, { status: 404 });

  const passport: any = {
    publicId: group.publicId,
    visibility: group.passportVisibility,
    name: group.name,
    groupType: group.groupType,
    sealed: group.sealed,
    quantity: group.quantity,
    cardSet: group.cardSet ? { name: group.cardSet.name, year: group.cardSet.year, manufacturer: group.cardSet.manufacturer } : null,
    itemCount: group._count.items,
    verified: true,
  };

  if (group.passportVisibility === 'PUBLIC_FOR_SALE') {
    passport.status = group.status;
    passport.askingPrice = group.askingPrice;
    passport.estimatedValue = group.estimatedValue;
  }

  return NextResponse.json({ passport });
}
