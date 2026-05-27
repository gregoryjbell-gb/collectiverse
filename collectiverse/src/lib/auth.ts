import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';

export interface SessionPayload {
  sub: string;
  username: string;
  role: string;
}

export function signToken(payload: { sub: string; username: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') throw new Error('Unauthorized');
  return session;
}

/**
 * Ensures a User record exists for the current session.
 * If the session is from a legacy Admin login, creates a User record for them.
 * Returns the User ID that can be used for inventory operations.
 */
export async function ensureUserId(session: SessionPayload): Promise<string> {
  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { id: session.sub } });
  if (existing) return existing.id;

  // If logged in as admin, check admin table and create a user record
  if (session.role === 'ADMIN') {
    const admin = await prisma.admin.findUnique({ where: { id: session.sub } });
    if (admin) {
      const user = await prisma.user.upsert({
        where: { username: admin.username },
        update: {},
        create: {
          id: admin.id, // Use same ID so session stays valid
          email: `${admin.username}@collectiverse.local`,
          username: admin.username,
          passwordHash: admin.passwordHash,
          displayName: admin.username,
          role: 'ADMIN',
        },
      });
      return user.id;
    }
  }

  throw new Error('User not found');
}

// Verify admin (legacy admin table)
export async function verifyAdmin(username: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) return null;
  const valid = bcrypt.compareSync(password, admin.passwordHash);
  if (!valid) return null;
  return { id: admin.id, username: admin.username, role: 'ADMIN' as const };
}

// Verify user (new user table)
export async function verifyUser(login: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: login }, { username: login }] },
  });
  if (!user) return null;
  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) return null;
  return { id: user.id, username: user.username || user.email, role: user.role };
}

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function setTokenCookie(token: string) {
  return {
    'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
  };
}
