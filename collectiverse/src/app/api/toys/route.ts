import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const toyType = searchParams.get('toyType');

  const where: any = {};
  if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { franchise: { contains: q, mode: 'insensitive' } }, { characterName: { contains: q, mode: 'insensitive' } }, { manufacturer: { contains: q, mode: 'insensitive' } }];
  if (toyType) where.toyType = toyType;

  const toys = await (prisma as any).toyCollectible.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ toys });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { toyType, name, franchise, characterName, manufacturer, brand, series, wave, scale, releaseYear, itemNumber, upc, sealed, completeInBox, limitedEdition, exclusiveRetailer, variantName, gradingCompany, gradeValue, certificationNumber } = body;
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const title = characterName ? `${franchise || ''} ${characterName}`.trim() : name;
  const subtitle = [series, wave, sealed ? 'Sealed' : completeInBox ? 'CIB' : null, exclusiveRetailer ? `${exclusiveRetailer} Exclusive` : null].filter(Boolean).join(' • ') || null;

  const collectible = await (prisma as any).collectible.create({
    data: { collectibleType: 'TOY', title, subtitle, year: releaseYear ? parseInt(releaseYear) : null, manufacturer: manufacturer || brand || null, franchise: franchise || null, status: 'ACTIVE' },
  });

  const toy = await (prisma as any).toyCollectible.create({
    data: {
      collectibleId: collectible.id, toyType: toyType || 'ACTION_FIGURE', name,
      franchise: franchise || null, characterName: characterName || null,
      manufacturer: manufacturer || null, brand: brand || null, series: series || null, wave: wave || null, scale: scale || null,
      releaseYear: releaseYear ? parseInt(releaseYear) : null, itemNumber: itemNumber || null, upc: upc || null,
      sealed: sealed || false, completeInBox: completeInBox || false, limitedEdition: limitedEdition || false,
      exclusiveRetailer: exclusiveRetailer || null, variantName: variantName || null,
      gradingCompany: gradingCompany || null, gradeValue: gradeValue || null, certificationNumber: certificationNumber || null,
    },
  });

  return NextResponse.json({ toy, collectible }, { status: 201 });
}
