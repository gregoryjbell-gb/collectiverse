import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const payment = await (prisma as any).paymentIntent.findUnique({ where: { id: params.id } });
  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await (prisma as any).paymentIntent.update({ where: { id: params.id }, data: { status: 'PAID', paidAt: new Date() } });
  await (prisma as any).paymentEvent.create({ data: { paymentIntentId: params.id, eventType: 'MARKED_PAID' } });

  return NextResponse.json({ success: true });
}
