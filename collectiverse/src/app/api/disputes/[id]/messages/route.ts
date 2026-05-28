import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  // Verify user is involved or admin
  const dispute = await (prisma as any).dispute.findUnique({ where: { id: params.id } });
  if (!dispute) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (session.role !== 'ADMIN' && dispute.openedByUserId !== userId && dispute.againstUserId !== userId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { message, attachmentUrl } = await req.json();
  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });

  const msg = await (prisma as any).disputeMessage.create({
    data: { disputeId: params.id, userId, message, attachmentUrl: attachmentUrl || null },
  });

  return NextResponse.json({ message: msg }, { status: 201 });
}
