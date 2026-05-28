import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const group = await (prisma as any).inventoryGroup.findFirst({ where: { id: params.id, userId } });
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

  await (prisma as any).inventoryGroupItem.delete({ where: { id: params.itemId } });
  return NextResponse.json({ success: true });
}
