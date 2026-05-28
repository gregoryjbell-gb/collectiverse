import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Open/break a sealed product
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const group = await (prisma as any).inventoryGroup.findFirst({ where: { id: params.id, userId } });
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  if (!group.sealed) return NextResponse.json({ error: 'This group is not sealed' }, { status: 400 });

  await (prisma as any).inventoryGroup.update({
    where: { id: params.id },
    data: { sealed: false, status: 'OPENED', groupType: 'OPENED_PRODUCT' },
  });

  return NextResponse.json({ success: true, message: 'Product opened. You can now add cards from this product to your inventory.' });
}
