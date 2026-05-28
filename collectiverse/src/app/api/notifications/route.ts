import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true';
  const where: any = { userId };
  if (unreadOnly) where.read = false;

  const [notifications, unreadCount] = await Promise.all([
    (prisma as any).notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 }),
    (prisma as any).notification.count({ where: { userId, read: false } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
