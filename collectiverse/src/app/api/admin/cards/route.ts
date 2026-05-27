import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cards = await prisma.card.findMany({
    include: { person: true, team: true, set: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ cards });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const card = await prisma.card.create({ data });
  return NextResponse.json({ card }, { status: 201 });
}
