import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function verifyOwnership(txId: string, userId: string) {
  const tx = await prisma.inventoryTransaction.findUnique({
    where: { id: txId },
    include: { inventoryItem: { select: { userId: true } } },
  });
  if (!tx || tx.inventoryItem.userId !== userId) return null;
  return tx;
}

export async function PATCH(req: NextRequest, { params }: { params: { txId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const tx = await verifyOwnership(params.txId, userId);
  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const updateData: any = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.amount !== undefined) updateData.amount = data.amount ? parseFloat(data.amount) : null;
  if (data.marketplace !== undefined) updateData.marketplace = data.marketplace || null;
  if (data.counterparty !== undefined) updateData.counterparty = data.counterparty || null;
  if (data.transactionDate !== undefined) updateData.transactionDate = data.transactionDate ? new Date(data.transactionDate) : null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  const transaction = await prisma.inventoryTransaction.update({ where: { id: params.txId }, data: updateData });
  return NextResponse.json({ transaction });
}

export async function DELETE(_req: NextRequest, { params }: { params: { txId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const tx = await verifyOwnership(params.txId, userId);
  if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.inventoryTransaction.delete({ where: { id: params.txId } });
  return NextResponse.json({ success: true });
}
