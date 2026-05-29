import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role'); // 'buyer' | 'seller' | null (both)

  const where: any = {};
  if (role === 'buyer') {
    where.buyerUserId = userId;
  } else if (role === 'seller') {
    where.sellerUserId = userId;
  } else {
    where.OR = [{ sellerUserId: userId }, { buyerUserId: userId }];
  }

  const sales = await (prisma as any).sale.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ sales });
}
