import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const publishers = await (prisma as any).comicPublisher.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { series: true } } },
  });
  return NextResponse.json({ publishers });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name } = body;
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const normalizedName = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const existing = await (prisma as any).comicPublisher.findUnique({ where: { normalizedName } });
  if (existing) return NextResponse.json({ publisher: existing });

  const publisher = await (prisma as any).comicPublisher.create({ data: { name, normalizedName } });
  return NextResponse.json({ publisher }, { status: 201 });
}
