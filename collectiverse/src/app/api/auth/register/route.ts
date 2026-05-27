import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, username, password, displayName } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, ...(username ? [{ username }] : [])] },
  });
  if (existing) {
    return NextResponse.json({ error: 'Email or username already taken' }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      username: username || null,
      passwordHash: hashPassword(password),
      displayName: displayName || username || email.split('@')[0],
    },
  });

  const token = signToken({ sub: user.id, username: user.username || user.email, role: user.role });
  const response = NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName, role: user.role },
  }, { status: 201 });

  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}
