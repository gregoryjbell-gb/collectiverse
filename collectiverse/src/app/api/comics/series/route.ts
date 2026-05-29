import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const publisherId = searchParams.get('publisherId');

  const where: any = {};
  if (q) where.title = { contains: q, mode: 'insensitive' };
  if (publisherId) where.publisherId = publisherId;

  const series = await (prisma as any).comicSeries.findMany({
    where,
    include: { publisher: { select: { name: true } }, _count: { select: { issues: true } } },
    orderBy: { title: 'asc' },
    take: 50,
  });

  return NextResponse.json({ series });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { publisherId, title, volume, startYear, endYear, genre, universe } = body;
  if (!publisherId || !title) return NextResponse.json({ error: 'publisherId and title required' }, { status: 400 });

  const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const series = await (prisma as any).comicSeries.create({
    data: { publisherId, title, normalizedTitle, volume: volume || null, startYear: startYear ? parseInt(startYear) : null, endYear: endYear ? parseInt(endYear) : null, genre: genre || null, universe: universe || null },
  });

  return NextResponse.json({ series }, { status: 201 });
}
