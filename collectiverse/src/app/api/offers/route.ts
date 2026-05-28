import { NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const [sent, received] = await Promise.all([
    (prisma as any).offer.findMany({ where: { buyerUserId: userId }, orderBy: { createdAt: 'desc' } }),
    (prisma as any).offer.findMany({ where: { sellerUserId: userId }, orderBy: { createdAt: 'desc' } }),
  ]);

  return NextResponse.json({ sent, received });
}
