import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { publicId: string } }) {
  const item = await prisma.inventoryItem.findFirst({
    where: { publicId: params.publicId, passportEnabled: true },
    include: {
      card: {
        include: {
          person: { select: { displayName: true } },
          set: { select: { name: true, year: true, manufacturer: true } },
          team: { select: { name: true } },
        },
      },
    },
  });

  if (!item) return NextResponse.json({ error: 'Passport not found' }, { status: 404 });

  // Build safe public response based on visibility
  const passport: any = {
    publicId: item.publicId,
    visibility: item.passportVisibility,
    card: {
      playerName: item.card.person?.displayName || null,
      setName: item.card.set?.name || null,
      year: item.card.year || item.card.set?.year,
      manufacturer: item.card.set?.manufacturer || null,
      cardNumber: item.card.cardNumber,
      teamName: item.card.team?.name || null,
      rookie: item.card.rookie,
      autograph: item.card.autograph,
      parallel: item.card.parallel,
      frontImageUrl: item.card.frontImageUrl,
    },
    condition: item.condition,
    gradeCompany: item.gradeCompany,
    gradeValue: item.gradeValue,
    certNumber: item.certNumber,
    verified: true,
  };

  if (item.passportVisibility === 'PUBLIC_FOR_SALE') {
    passport.status = item.status;
    passport.askingPrice = item.askingPrice;
  }

  // Never expose: purchasePrice, storageLocation, notes, private scans, owner name
  return NextResponse.json({ passport });
}
