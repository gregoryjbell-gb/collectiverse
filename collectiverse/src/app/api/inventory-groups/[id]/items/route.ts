import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Add an inventory item to a group
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  // Verify group ownership
  const group = await (prisma as any).inventoryGroup.findFirst({ where: { id: params.id, userId } });
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  const { inventoryItemId, quantity, notes } = await req.json();
  if (!inventoryItemId) return NextResponse.json({ error: 'inventoryItemId is required' }, { status: 400 });

  // Verify item ownership
  const item = await prisma.inventoryItem.findFirst({ where: { id: inventoryItemId, userId } });
  if (!item) return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });

  const groupItem = await (prisma as any).inventoryGroupItem.create({
    data: {
      inventoryGroupId: params.id,
      inventoryItemId,
      quantity: quantity || 1,
      notes: notes || null,
    },
  });

  return NextResponse.json({ groupItem }, { status: 201 });
}
