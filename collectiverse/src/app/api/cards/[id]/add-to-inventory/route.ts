import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const card = await prisma.card.findUnique({ where: { id: params.id } });
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const data = await req.json();

  const item = await prisma.inventoryItem.create({
    data: {
      userId: session.sub,
      cardId: params.id,
      quantity: data.quantity || 1,
      condition: data.condition || null,
      gradeCompany: data.gradeCompany || null,
      gradeValue: data.gradeValue || null,
      certNumber: data.certNumber || null,
      acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : null,
      purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
      estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue) : null,
      askingPrice: data.askingPrice ? parseFloat(data.askingPrice) : null,
      status: data.status || 'OWNED',
      storageLocation: data.storageLocation || null,
      notes: data.notes || null,
    },
    include: {
      card: { include: { person: true, set: true, team: true } },
    },
  });

  if (data.purchasePrice) {
    await prisma.inventoryTransaction.create({
      data: {
        inventoryItemId: item.id,
        type: 'PURCHASE',
        amount: parseFloat(data.purchasePrice),
        transactionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : new Date(),
      },
    });
  }

  return NextResponse.json({ item }, { status: 201 });
}
