import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Returns players, sets, and teams for inventory add form dropdowns
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [players, sets, teams] = await Promise.all([
    prisma.person.findMany({ select: { id: true, displayName: true }, orderBy: { displayName: 'asc' } }),
    prisma.cardSet.findMany({ select: { id: true, name: true, year: true, manufacturer: true }, orderBy: [{ year: 'desc' }, { name: 'asc' }] }),
    prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  return NextResponse.json({ players, sets, teams });
}
