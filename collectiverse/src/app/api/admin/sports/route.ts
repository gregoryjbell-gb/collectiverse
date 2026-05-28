import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sports = await prisma.sport.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ sports });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, league } = await req.json();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const existing = await prisma.sport.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ error: 'Sport already exists' }, { status: 409 });

  const sport = await prisma.sport.create({ data: { name, league: league || null } });
  return NextResponse.json({ sport }, { status: 201 });
}
