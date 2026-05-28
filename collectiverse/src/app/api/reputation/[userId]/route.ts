import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  let rep = await (prisma as any).userReputation.findUnique({ where: { userId: params.userId } });
  if (!rep) rep = { totalSales: 0, totalPurchases: 0, completedTransfers: 0, positiveFeedback: 0, neutralFeedback: 0, negativeFeedback: 0, reputationScore: 0, verifiedCollector: false };

  const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { displayName: true, username: true, createdAt: true } });

  return NextResponse.json({
    reputation: rep,
    seller: { displayName: user?.displayName || user?.username || 'User', memberSince: user?.createdAt },
  });
}
