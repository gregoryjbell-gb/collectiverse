import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sets = await prisma.cardSet.findMany({
    include: { sport: true, _count: { select: { cards: true } } },
    orderBy: { year: 'desc' },
  });
  return NextResponse.json({ sets });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const { name, year, manufacturer, sportId, releaseDate } = data;

  if (!name || !year) {
    return NextResponse.json({ error: 'name and year are required' }, { status: 400 });
  }

  const set = await prisma.cardSet.create({
    data: {
      name,
      year: parseInt(year),
      manufacturer: manufacturer || null,
      sportId: sportId || null,
      releaseDate: releaseDate || null,
    },
  });

  return NextResponse.json({ set }, { status: 201 });
}
