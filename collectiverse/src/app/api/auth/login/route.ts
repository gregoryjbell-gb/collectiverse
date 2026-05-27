import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, verifyUser, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, password, email } = await req.json();
  const login = username || email;

  if (!login || !password) {
    return NextResponse.json({ error: 'Login and password required' }, { status: 400 });
  }

  // Try user table first
  const user = await verifyUser(login, password);
  if (user) {
    const token = signToken({ sub: user.id, username: user.username, role: user.role });
    const response = NextResponse.json({ success: true, username: user.username, role: user.role });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  }

  // Fall back to legacy admin table
  const admin = await verifyAdmin(login, password);
  if (admin) {
    const token = signToken({ sub: admin.id, username: admin.username, role: 'ADMIN' });
    const response = NextResponse.json({ success: true, username: admin.username, role: 'ADMIN' });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return response;
  }

  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
