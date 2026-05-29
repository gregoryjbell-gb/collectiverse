import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { normalizeManufacturerName } from '@/lib/product-normalization';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const manufacturers = await (prisma as any).manufacturer.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { brands: true, productReleases: true } } },
  });

  return NextResponse.json({ manufacturers });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { name, aliases } = body;
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const normalizedName = normalizeManufacturerName(name);
  const existing = await (prisma as any).manufacturer.findUnique({ where: { normalizedName } });
  if (existing) return NextResponse.json({ error: 'Manufacturer already exists', manufacturer: existing }, { status: 409 });

  const manufacturer = await (prisma as any).manufacturer.create({
    data: { name, normalizedName, aliases: aliases ? JSON.stringify(aliases) : null },
  });

  return NextResponse.json({ manufacturer }, { status: 201 });
}
