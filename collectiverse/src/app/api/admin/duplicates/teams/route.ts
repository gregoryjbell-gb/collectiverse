import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const teams = await (prisma as any).team.findMany({
    include: { sport: { select: { name: true } }, _count: { select: { cards: true, personTeams: true } } },
    orderBy: { name: 'asc' },
  });

  const groups: Record<string, any[]> = {};
  for (const team of teams) {
    const normalized = team.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    if (!groups[normalized]) groups[normalized] = [];
    groups[normalized].push(team);
  }

  const duplicates = Object.entries(groups)
    .filter(([, g]) => g.length > 1)
    .map(([key, teams]) => ({ key, teams }));

  return NextResponse.json({ duplicates });
}
