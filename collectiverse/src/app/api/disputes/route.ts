import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const where = session.role === 'ADMIN' ? {} : { OR: [{ openedByUserId: userId }, { againstUserId: userId }] };
  const disputes = await (prisma as any).dispute.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ disputes });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const { againstUserId, listingId, offerId, transferId, reason, description } = await req.json();
  if (!againstUserId || !reason || !description) return NextResponse.json({ error: 'againstUserId, reason, and description required' }, { status: 400 });
  if (againstUserId === userId) return NextResponse.json({ error: 'Cannot open dispute against yourself' }, { status: 400 });

  const dispute = await (prisma as any).dispute.create({
    data: { openedByUserId: userId, againstUserId, listingId: listingId || null, offerId: offerId || null, transferId: transferId || null, reason, description },
  });

  await createNotification({ userId: againstUserId, type: 'SYSTEM', title: 'Dispute Opened', message: `A dispute has been opened regarding a transaction.`, entityType: 'DISPUTE', entityId: dispute.id });

  return NextResponse.json({ dispute }, { status: 201 });
}
