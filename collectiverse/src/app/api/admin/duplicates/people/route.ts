import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const persons = await (prisma as any).person.findMany({
    include: { _count: { select: { cards: true } } },
    orderBy: { displayName: 'asc' },
  });

  // Normalize and group by similar names
  const groups: Record<string, any[]> = {};
  for (const person of persons) {
    const normalized = person.displayName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    if (!groups[normalized]) groups[normalized] = [];
    groups[normalized].push(person);
  }

  const duplicates = Object.entries(groups)
    .filter(([, g]) => g.length > 1)
    .map(([key, persons]) => ({ key, persons }));

  return NextResponse.json({ duplicates });
}
