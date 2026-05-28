import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const notif = await (prisma as any).notification.findFirst({ where: { id: params.id, userId } });
  if (!notif) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await (prisma as any).notification.update({ where: { id: params.id }, data: { read: true } });
  return NextResponse.json({ success: true });
}
