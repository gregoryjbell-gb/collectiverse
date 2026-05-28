import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const VALID_TYPES = ['PURCHASE', 'SALE', 'TRADE', 'GRADE_SUBMISSION', 'GRADE_RETURN', 'VALUE_UPDATE', 'TRANSFER', 'NOTE'];

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

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: `type is required. Must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
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

  // Side effects
  const updateData: any = {};

  if (type === 'SALE' && data.markAsSold !== false) {
    updateData.status = 'SOLD';
    if (amount) updateData.askingPrice = parseFloat(amount);
  }

  if (type === 'VALUE_UPDATE' && amount) {
    updateData.estimatedValue = parseFloat(amount);
  }

  if (type === 'GRADE_RETURN') {
    if (data.gradeCompany) updateData.gradeCompany = data.gradeCompany;
    if (data.gradeValue) updateData.gradeValue = data.gradeValue;
    if (data.gradeCompany) updateData.condition = data.gradeCompany;
  }

  if (type === 'PURCHASE' && amount) {
    updateData.purchasePrice = parseFloat(amount);
    if (transactionDate) updateData.acquisitionDate = new Date(transactionDate);
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.inventoryItem.update({ where: { id: params.id }, data: updateData });
  }

  return NextResponse.json({ transaction }, { status: 201 });
}
