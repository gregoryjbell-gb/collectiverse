import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const { canonicalId, mergeIds } = body;

  if (!canonicalId || !mergeIds?.length) {
    return NextResponse.json({ error: 'canonicalId and mergeIds are required' }, { status: 400 });
  }

  let movedCards = 0;

  for (const mergeId of mergeIds) {
    if (mergeId === canonicalId) continue;

    // Move cards to canonical person
    const result = await (prisma as any).card.updateMany({
      where: { personId: mergeId },
      data: { personId: canonicalId },
    });
    movedCards += result.count;

    // Move person-team links
    await (prisma as any).personTeam.updateMany({ where: { personId: mergeId }, data: { personId: canonicalId } }).catch(() => {});

    // Move person-sport links
    await (prisma as any).personSport.deleteMany({ where: { personId: mergeId } }).catch(() => {});

    // Delete the duplicate person
    await (prisma as any).person.delete({ where: { id: mergeId } });
  }

  await createAuditLog({
    actorUserId: userId,
    entityType: 'CARD',
    entityId: canonicalId,
    action: 'UPDATED',
    after: { merged: mergeIds, movedCards },
    notes: `Merged ${mergeIds.length} duplicate persons into canonical`,
  });

  return NextResponse.json({ success: true, canonicalId, merged: mergeIds.length, movedCards });
}
