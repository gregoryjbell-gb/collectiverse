import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sets = await (prisma as any).cardSet.findMany({
    include: { sport: { select: { name: true } }, _count: { select: { cards: true } } },
    orderBy: [{ year: 'desc' }, { name: 'asc' }],
  });

  const groups: Record<string, any[]> = {};
  for (const s of sets) {
    const normalized = `${s.year}|${(s.manufacturer || '').toLowerCase().trim()}|${s.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()}`;
    if (!groups[normalized]) groups[normalized] = [];
    groups[normalized].push(s);
  }

  const duplicates = Object.entries(groups)
    .filter(([, g]) => g.length > 1)
    .map(([key, sets]) => ({ key, sets }));

  return NextResponse.json({ duplicates });
}
