import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  const where: any = {};
  if (q) where.title = { contains: q, mode: 'insensitive' };

  const series = await (prisma as any).comicSeries.findMany({
    where,
    include: { _count: { select: { issues: true } } },
    orderBy: { title: 'asc' },
    take: 50,
  });

  return NextResponse.json({ series });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { publisher, title, volume, startYear, endYear, genre, universe } = body;
  if (!publisher || !title) return NextResponse.json({ error: 'publisher and title required' }, { status: 400 });

  const series = await (prisma as any).comicSeries.create({
    data: { publisher, title, volume: volume ? parseInt(volume) : null, startYear: startYear ? parseInt(startYear) : null, endYear: endYear ? parseInt(endYear) : null, genre: genre || null, universe: universe || null },
  });

  return NextResponse.json({ series }, { status: 201 });
}
