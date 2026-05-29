import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const sale = await (prisma as any).sale.findUnique({ where: { id: params.id } });
  if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
  if (sale.sellerUserId !== userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { expenseType, amount, description, expenseDate } = body;

  if (!expenseType || amount === undefined) {
    return NextResponse.json({ error: 'expenseType and amount are required' }, { status: 400 });
  }

  const expense = await (prisma as any).saleExpense.create({
    data: {
      saleId: params.id,
      userId,
      expenseType,
      amount: parseFloat(amount),
      description: description || null,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
    },
  });

  return NextResponse.json({ expense }, { status: 201 });
}
