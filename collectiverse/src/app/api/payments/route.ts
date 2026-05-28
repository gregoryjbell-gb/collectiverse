import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const payments = await (prisma as any).paymentIntent.findMany({
    where: { OR: [{ buyerUserId: userId }, { sellerUserId: userId }] },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ payments });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const { sellerUserId, listingId, offerId, transferId, amount, currency } = await req.json();
  if (!sellerUserId || !amount) return NextResponse.json({ error: 'sellerUserId and amount required' }, { status: 400 });

  const payment = await (prisma as any).paymentIntent.create({
    data: {
      buyerUserId: userId,
      sellerUserId,
      listingId: listingId || null,
      offerId: offerId || null,
      transferId: transferId || null,
      amount: parseFloat(amount),
      currency: currency || 'USD',
      status: 'PENDING',
    },
  });

  return NextResponse.json({ payment }, { status: 201 });
}
