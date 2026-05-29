import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const productType = searchParams.get('productType');
  const year = searchParams.get('year');

  const where: any = {};
  if (q) where.name = { contains: q, mode: 'insensitive' };
  if (productType) where.productType = productType;
  if (year) where.year = parseInt(year);

  const products = await (prisma as any).sealedProduct.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, productType, year, category, franchise, configuration, packsPerBox, cardsPerPack, boxesPerCase, upc, sku, notes } = body;
  if (!name || !productType) return NextResponse.json({ error: 'name and productType required' }, { status: 400 });

  // Create Collectible
  const subtitle = configuration || (packsPerBox && cardsPerPack ? `${packsPerBox} packs, ${cardsPerPack} cards/pack` : null);
  const collectible = await (prisma as any).collectible.create({
    data: { collectibleType: 'SEALED_PRODUCT', title: name, subtitle, year: year ? parseInt(year) : null, manufacturer: body.manufacturer || null, franchise: franchise || null, status: 'ACTIVE' },
  });

  const product = await (prisma as any).sealedProduct.create({
    data: {
      collectibleId: collectible.id, productType, name, year: year ? parseInt(year) : null,
      category: category || 'SPORTS_CARD', franchise: franchise || null,
      configuration: configuration || null, packsPerBox: packsPerBox ? parseInt(packsPerBox) : null,
      cardsPerPack: cardsPerPack ? parseInt(cardsPerPack) : null, boxesPerCase: boxesPerCase ? parseInt(boxesPerCase) : null,
      upc: upc || null, sku: sku || null, notes: notes || null,
    },
  });

  return NextResponse.json({ product, collectible }, { status: 201 });
}
