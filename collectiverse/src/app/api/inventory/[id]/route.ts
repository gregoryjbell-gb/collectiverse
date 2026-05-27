import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const item = await prisma.inventoryItem.findFirst({
    where: { id: params.id, userId: session.sub },
    include: {
      card: {
        include: {
          person: true,
          team: true,
          set: { include: { sport: true } },
        },
      },
      transactions: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify ownership
  const existing = await prisma.inventoryItem.findFirst({
    where: { id: params.id, userId: session.sub },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const allowedFields = ['quantity', 'condition', 'gradeCompany', 'gradeValue', 'certNumber', 'acquisitionDate', 'purchasePrice', 'estimatedValue', 'askingPrice', 'status', 'storageLocation', 'notes', 'privateImageUrl', 'frontScanUrl', 'backScanUrl'];

  const updateData: any = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (field === 'acquisitionDate' && data[field]) {
        updateData[field] = new Date(data[field]);
      } else if (['purchasePrice', 'estimatedValue', 'askingPrice'].includes(field) && data[field] !== null) {
        updateData[field] = parseFloat(data[field]);
      } else if (field === 'quantity' && data[field] !== null) {
        updateData[field] = parseInt(data[field]);
      } else {
        updateData[field] = data[field];
      }
    }
  }

  const item = await prisma.inventoryItem.update({
    where: { id: params.id },
    data: updateData,
    include: {
      card: { include: { person: true, set: true, team: true } },
    },
  });

  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.inventoryItem.findFirst({
    where: { id: params.id, userId: session.sub },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.inventoryItem.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
