import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Find cards without identities
  const cardsWithoutIdentity = await (prisma as any).card.findMany({
    where: {
      id: {
        notIn: await (prisma as any).cardIdentity.findMany({ select: { canonicalCardId: true } }).then((ids: any[]) => ids.map(i => i.canonicalCardId)),
      },
    },
    include: {
      person: { select: { displayName: true } },
      set: { select: { name: true, year: true, manufacturer: true } },
    },
    take: 100,
  });

  // Find potential fingerprint collisions (same normalized fingerprint, different cards)
  const allIdentities = await (prisma as any).cardIdentity.findMany({
    orderBy: { normalizedFingerprint: 'asc' },
  });

  // Group by base fingerprint (first 5 parts without parallel/variation)
  const baseGroups: Record<string, any[]> = {};
  for (const identity of allIdentities) {
    const baseParts = identity.fingerprint.split('|').slice(0, 5).join('|');
    if (!baseGroups[baseParts]) baseGroups[baseParts] = [];
    baseGroups[baseParts].push(identity);
  }

  const potentialConflicts = Object.entries(baseGroups)
    .filter(([, group]) => group.length > 1)
    .map(([key, identities]) => ({ baseFingerprint: key, identities, count: identities.length }));

  return NextResponse.json({
    cardsWithoutIdentity: cardsWithoutIdentity.length,
    cardsWithoutIdentityList: cardsWithoutIdentity.slice(0, 20),
    potentialConflicts,
  });
}
