import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, username: true, displayName: true, role: true, createdAt: true, _count: { select: { inventoryItems: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, username, password, displayName, role } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, ...(username ? [{ username }] : [])] },
  });
  if (existing) return NextResponse.json({ error: 'Email or username already taken' }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      email,
      username: username || null,
      passwordHash: hashPassword(password),
      displayName: displayName || username || email.split('@')[0],
      role: role || 'USER',
    },
    select: { id: true, email: true, username: true, displayName: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
