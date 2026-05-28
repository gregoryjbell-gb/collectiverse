import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  // Get transfers where user is sender or recipient
  const transfers = await (prisma as any).ownershipTransfer.findMany({
    where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ transfers });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const data = await req.json();
  const { recipientEmail, recipientUsername, inventoryItemId, inventoryGroupId, listingId, transferType, transferPrice, notes } = data;

  if (!transferType || !['SALE', 'TRADE', 'GIFT', 'PRIVATE_TRANSFER'].includes(transferType)) {
    return NextResponse.json({ error: 'Invalid transferType' }, { status: 400 });
  }

  // Find recipient
  const recipientWhere: any = {};
  if (recipientEmail) recipientWhere.email = recipientEmail;
  else if (recipientUsername) recipientWhere.username = recipientUsername;
  else return NextResponse.json({ error: 'recipientEmail or recipientUsername required' }, { status: 400 });

  const recipient = await prisma.user.findFirst({ where: recipientWhere });
  if (!recipient) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
  if (recipient.id === userId) return NextResponse.json({ error: 'Cannot transfer to yourself' }, { status: 400 });

  // Verify ownership
  if (inventoryItemId) {
    const item = await prisma.inventoryItem.findFirst({ where: { id: inventoryItemId, userId } });
    if (!item) return NextResponse.json({ error: 'Inventory item not found or not owned' }, { status: 404 });
  }
  if (inventoryGroupId) {
    const group = await (prisma as any).inventoryGroup.findFirst({ where: { id: inventoryGroupId, userId } });
    if (!group) return NextResponse.json({ error: 'Inventory group not found or not owned' }, { status: 404 });
  }

  const transfer = await (prisma as any).ownershipTransfer.create({
    data: {
      fromUserId: userId,
      toUserId: recipient.id,
      inventoryItemId: inventoryItemId || null,
      inventoryGroupId: inventoryGroupId || null,
      listingId: listingId || null,
      transferType,
      transferPrice: transferPrice ? parseFloat(transferPrice) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json({ transfer }, { status: 201 });
}
