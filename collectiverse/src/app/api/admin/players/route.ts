import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const players = await prisma.person.findMany({
    include: { personSports: { include: { sport: true } }, _count: { select: { cards: true } } },
    orderBy: { displayName: 'asc' },
  });
  return NextResponse.json({ players });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const person = await prisma.person.create({ data });
  return NextResponse.json({ person }, { status: 201 });
}
