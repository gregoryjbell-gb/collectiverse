import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const adminId = await ensureUserId(session);

  const body = await req.json().catch(() => ({}));

  const review = await (prisma as any).publicCardReview.findUnique({ where: { id: params.id } });
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  await (prisma as any).card.update({
    where: { id: review.cardId },
    data: { publicDataStatus: 'ADMIN_VERIFIED', status: 'approved' },
  });

  await (prisma as any).publicCardReview.update({
    where: { id: params.id },
    data: { status: 'APPROVED', reviewerAdminId: adminId, adminNotes: body.notes || null, reviewedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
