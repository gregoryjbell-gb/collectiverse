import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const where: any = { id: params.id };
  if (session.role !== 'ADMIN') where.OR = [{ buyerUserId: userId }, { sellerUserId: userId }];

  const payment = await (prisma as any).paymentIntent.findFirst({ where, include: { events: { orderBy: { createdAt: 'desc' } } } });
  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ payment });
}
