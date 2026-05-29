import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const manufacturerId = searchParams.get('manufacturerId');
  const brandId = searchParams.get('brandId');
  const year = searchParams.get('year');

  const where: any = {};
  if (manufacturerId) where.manufacturerId = manufacturerId;
  if (brandId) where.brandId = brandId;
  if (year) where.year = parseInt(year);

  const releases = await (prisma as any).productRelease.findMany({
    where,
    orderBy: [{ year: 'desc' }, { name: 'asc' }],
    include: {
      manufacturer: { select: { name: true } },
      brand: { select: { name: true } },
      _count: { select: { checklistSections: true } },
    },
    take: 100,
  });

  return NextResponse.json({ releases });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { manufacturerId, brandId, year, name, category, sportId, franchise } = body;
  if (!manufacturerId || !year || !name) return NextResponse.json({ error: 'manufacturerId, year, and name are required' }, { status: 400 });

  const release = await (prisma as any).productRelease.create({
    data: { manufacturerId, brandId: brandId || null, year: parseInt(year), name, category: category || 'SPORTS_CARD', sportId: sportId || null, franchise: franchise || null },
  });

  return NextResponse.json({ release }, { status: 201 });
}
