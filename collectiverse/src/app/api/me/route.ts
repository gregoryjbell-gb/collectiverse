import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Try user table
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, username: true, displayName: true, role: true, createdAt: true },
  });

  if (user) {
    return NextResponse.json({ user });
  }

  // Legacy admin
  return NextResponse.json({ user: { id: session.sub, username: session.username, displayName: session.username, role: session.role } });
}
