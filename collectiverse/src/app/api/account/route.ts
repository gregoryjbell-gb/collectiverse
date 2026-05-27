import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const data = await req.json();
  const updateData: any = {};

  if (data.displayName !== undefined) updateData.displayName = data.displayName || null;
  if (data.username !== undefined) {
    if (data.username) {
      const existing = await prisma.user.findFirst({ where: { username: data.username, id: { not: userId } } });
      if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }
    updateData.username = data.username || null;
  }
  if (data.email !== undefined) {
    if (!data.email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    const existing = await prisma.user.findFirst({ where: { email: data.email, id: { not: userId } } });
    if (existing) return NextResponse.json({ error: 'Email already taken' }, { status: 409 });
    updateData.email = data.email;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, email: true, username: true, displayName: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user });
}
