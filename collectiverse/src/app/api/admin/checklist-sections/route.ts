import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const productReleaseId = searchParams.get('productReleaseId');

  const where: any = {};
  if (productReleaseId) where.productReleaseId = productReleaseId;

  const sections = await (prisma as any).checklistSection.findMany({
    where,
    orderBy: { name: 'asc' },
    include: { productRelease: { select: { name: true, year: true } }, children: { select: { id: true, name: true, sectionType: true } } },
  });

  return NextResponse.json({ sections });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { productReleaseId, name, sectionType, parentSectionId } = body;
  if (!productReleaseId || !name) return NextResponse.json({ error: 'productReleaseId and name are required' }, { status: 400 });

  const section = await (prisma as any).checklistSection.create({
    data: { productReleaseId, name, sectionType: sectionType || 'BASE', parentSectionId: parentSectionId || null },
  });

  return NextResponse.json({ section }, { status: 201 });
}
