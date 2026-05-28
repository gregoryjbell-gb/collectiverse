import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const feedback = await (prisma as any).feedback.findMany({
    where: { toUserId: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ feedback });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const { toUserId, transferId, listingId, rating, comment } = await req.json();
  if (!toUserId || !rating) return NextResponse.json({ error: 'toUserId and rating required' }, { status: 400 });
  if (!['POSITIVE', 'NEUTRAL', 'NEGATIVE'].includes(rating)) return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
  if (toUserId === userId) return NextResponse.json({ error: 'Cannot leave feedback for yourself' }, { status: 400 });

  const fb = await (prisma as any).feedback.create({
    data: { fromUserId: userId, toUserId, transferId: transferId || null, listingId: listingId || null, rating, comment: comment || null },
  });

  // Update reputation
  const ratingField = rating === 'POSITIVE' ? 'positiveFeedback' : rating === 'NEUTRAL' ? 'neutralFeedback' : 'negativeFeedback';
  await (prisma as any).userReputation.upsert({
    where: { userId: toUserId },
    create: { userId: toUserId, [ratingField]: 1, reputationScore: rating === 'POSITIVE' ? 1 : rating === 'NEGATIVE' ? -1 : 0 },
    update: { [ratingField]: { increment: 1 } },
  });

  // Recalculate score
  const rep = await (prisma as any).userReputation.findUnique({ where: { userId: toUserId } });
  if (rep) {
    const total = rep.positiveFeedback + rep.neutralFeedback + rep.negativeFeedback;
    const score = total > 0 ? ((rep.positiveFeedback - rep.negativeFeedback) / total) * 100 : 0;
    await (prisma as any).userReputation.update({ where: { userId: toUserId }, data: { reputationScore: Math.round(score * 10) / 10 } });
  }

  return NextResponse.json({ feedback: fb }, { status: 201 });
}
