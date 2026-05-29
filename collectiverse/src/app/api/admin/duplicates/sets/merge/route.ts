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
    const result = await (prisma as any).card.updateMany({ where: { setId: mergeId }, data: { setId: canonicalId } });
    movedCards += result.count;
    await (prisma as any).inventoryGroup.updateMany({ where: { cardSetId: mergeId }, data: { cardSetId: canonicalId } }).catch(() => {});
    await (prisma as any).cardSet.delete({ where: { id: mergeId } });
  }

  await createAuditLog({ actorUserId: userId, entityType: 'CARD_SET', entityId: canonicalId, action: 'UPDATED', after: { merged: mergeIds, movedCards }, notes: `Merged ${mergeIds.length} duplicate sets` });

  return NextResponse.json({ success: true, canonicalId, merged: mergeIds.length, movedCards });
}
