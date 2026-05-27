import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const item = await prisma.inventoryItem.findFirst({
    where: { id: params.id, userId },
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

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  // Verify ownership
  const existing = await prisma.inventoryItem.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const allowedFields = ['quantity', 'condition', 'gradeCompany', 'gradeValue', 'certNumber', 'acquisitionDate', 'purchasePrice', 'estimatedValue', 'askingPrice', 'status', 'storageLocation', 'notes', 'privateImageUrl', 'frontScanUrl', 'backScanUrl'];

  const updateData: any = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (field === 'acquisitionDate') {
        updateData[field] = data[field] ? new Date(data[field]) : null;
      } else if (['purchasePrice', 'estimatedValue', 'askingPrice'].includes(field)) {
        const val = data[field];
        updateData[field] = (val === '' || val === null) ? null : parseFloat(val);
      } else if (field === 'quantity') {
        const val = data[field];
        updateData[field] = (val === '' || val === null) ? 1 : parseInt(val);
      } else {
        updateData[field] = data[field] || null;
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

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const existing = await prisma.inventoryItem.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.inventoryItem.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
