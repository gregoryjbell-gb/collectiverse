import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const teams = await prisma.team.findMany({ include: { sport: true }, orderBy: { name: 'asc' } });
  return NextResponse.json({ teams });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, sportId, city, colors } = await req.json();
  if (!name || !sportId) return NextResponse.json({ error: 'name and sportId are required' }, { status: 400 });

  const team = await prisma.team.create({
    data: { name, sportId, city: city || null, colors: colors || [] },
    include: { sport: true },
  });
  return NextResponse.json({ team }, { status: 201 });
}
