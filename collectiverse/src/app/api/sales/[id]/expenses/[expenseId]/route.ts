import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string; expenseId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const expense = await (prisma as any).saleExpense.findFirst({ where: { id: params.expenseId, saleId: params.id, userId } });
  if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

  const body = await req.json();
  const data: any = {};
  if (body.expenseType !== undefined) data.expenseType = body.expenseType;
  if (body.amount !== undefined) data.amount = parseFloat(body.amount);
  if (body.description !== undefined) data.description = body.description;
  if (body.expenseDate !== undefined) data.expenseDate = new Date(body.expenseDate);

  const updated = await (prisma as any).saleExpense.update({ where: { id: params.expenseId }, data });
  return NextResponse.json({ expense: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; expenseId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const expense = await (prisma as any).saleExpense.findFirst({ where: { id: params.expenseId, saleId: params.id, userId } });
  if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

  await (prisma as any).saleExpense.delete({ where: { id: params.expenseId } });
  return NextResponse.json({ success: true });
}
