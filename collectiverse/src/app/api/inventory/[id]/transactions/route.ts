import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const item = await prisma.inventoryItem.findFirst({ where: { id: params.id, userId } });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const transactions = await prisma.inventoryTransaction.findMany({
    where: { inventoryItemId: params.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ transactions });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const item = await prisma.inventoryItem.findFirst({ where: { id: params.id, userId } });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const { type, amount, marketplace, counterparty, transactionDate, notes } = data;

  const validTypes = ['PURCHASE', 'SALE', 'TRADE', 'GRADE_SUBMISSION', 'VALUE_UPDATE'];
  if (!type || !validTypes.includes(type)) {
    return NextResponse.json({ error: `type is required. Must be one of: ${validTypes.join(', ')}` }, { status: 400 });
  }

  const transaction = await prisma.inventoryTransaction.create({
    data: {
      inventoryItemId: params.id,
      type,
      amount: amount ? parseFloat(amount) : null,
      marketplace: marketplace || null,
      counterparty: counterparty || null,
      transactionDate: transactionDate ? new Date(transactionDate) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
