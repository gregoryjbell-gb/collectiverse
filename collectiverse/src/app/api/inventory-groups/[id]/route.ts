import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const group = await (prisma as any).inventoryGroup.findFirst({
    where: { id: params.id, userId },
    include: {
      cardSet: { select: { id: true, name: true, year: true, _count: { select: { cards: true } } } },
      items: {
        include: {
          inventoryItem: {
            include: { card: { include: { person: { select: { displayName: true } }, set: { select: { name: true } }, team: { select: { name: true } } } } },
          },
        },
      },
    },
  });

  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ group });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const existing = await (prisma as any).inventoryGroup.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const allowedFields = ['name', 'description', 'groupType', 'cardSetId', 'sealed', 'quantity', 'purchasePrice', 'estimatedValue', 'askingPrice', 'acquisitionDate', 'storageLocation', 'notes', 'status'];
  const updateData: any = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (['purchasePrice', 'estimatedValue', 'askingPrice'].includes(field)) {
        updateData[field] = data[field] ? parseFloat(data[field]) : null;
      } else if (field === 'quantity') {
        updateData[field] = data[field] ? parseInt(data[field]) : 1;
      } else if (field === 'acquisitionDate') {
        updateData[field] = data[field] ? new Date(data[field]) : null;
      } else if (field === 'sealed') {
        updateData[field] = Boolean(data[field]);
      } else {
        updateData[field] = data[field] || null;
      }
    }
  }

  const group = await (prisma as any).inventoryGroup.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json({ group });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const existing = await (prisma as any).inventoryGroup.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await (prisma as any).inventoryGroup.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
