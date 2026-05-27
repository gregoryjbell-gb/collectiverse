import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string; txId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  // Verify ownership chain
  const item = await prisma.inventoryItem.findFirst({ where: { id: params.id, userId } });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const existing = await prisma.inventoryTransaction.findFirst({
    where: { id: params.txId, inventoryItemId: params.id },
  });
  if (!existing) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

  const data = await req.json();
  const updateData: any = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.amount !== undefined) updateData.amount = data.amount ? parseFloat(data.amount) : null;
  if (data.marketplace !== undefined) updateData.marketplace = data.marketplace || null;
  if (data.counterparty !== undefined) updateData.counterparty = data.counterparty || null;
  if (data.transactionDate !== undefined) updateData.transactionDate = data.transactionDate ? new Date(data.transactionDate) : null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  const transaction = await prisma.inventoryTransaction.update({
    where: { id: params.txId },
    data: updateData,
  });

  return NextResponse.json({ transaction });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; txId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const item = await prisma.inventoryItem.findFirst({ where: { id: params.id, userId } });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const existing = await prisma.inventoryTransaction.findFirst({
    where: { id: params.txId, inventoryItemId: params.id },
  });
  if (!existing) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

  await prisma.inventoryTransaction.delete({ where: { id: params.txId } });
  return NextResponse.json({ success: true });
}
