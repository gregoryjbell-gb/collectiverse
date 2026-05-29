import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const manufacturerId = searchParams.get('manufacturerId');

  const where: any = {};
  if (manufacturerId) where.manufacturerId = manufacturerId;

  const brands = await (prisma as any).brand.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { manufacturer: { select: { name: true } }, _count: { select: { productReleases: true } } },
  });

  return NextResponse.json({ brands });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { manufacturerId, name } = body;
  if (!manufacturerId || !name) return NextResponse.json({ error: 'manufacturerId and name are required' }, { status: 400 });

  const normalizedName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  const brand = await (prisma as any).brand.create({
    data: { manufacturerId, name, normalizedName },
  });

  return NextResponse.json({ brand }, { status: 201 });
}
