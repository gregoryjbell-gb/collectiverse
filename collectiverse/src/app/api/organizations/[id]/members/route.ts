import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  // Check membership
  const membership = await (prisma as any).organizationMember.findFirst({ where: { organizationId: params.id, userId, status: 'ACTIVE' } });
  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 });

  const members = await (prisma as any).organizationMember.findMany({
    where: { organizationId: params.id },
    orderBy: { createdAt: 'asc' },
  });

  // Get user info
  const userIds = members.map((m: any) => m.userId);
  const users = await (prisma as any).user.findMany({ where: { id: { in: userIds } }, select: { id: true, displayName: true, username: true, email: true } });
  const userMap: Record<string, any> = {};
  for (const u of users) userMap[u.id] = u;

  return NextResponse.json({ members: members.map((m: any) => ({ ...m, user: userMap[m.userId] })) });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  // Check if OWNER or ADMIN
  const membership = await (prisma as any).organizationMember.findFirst({ where: { organizationId: params.id, userId, status: 'ACTIVE', role: { in: ['OWNER', 'ADMIN'] } } });
  if (!membership) return NextResponse.json({ error: 'Only owner/admin can invite' }, { status: 403 });

  const body = await req.json();
  const { inviteUserId, email, role } = body;

  let targetUserId = inviteUserId;
  if (!targetUserId && email) {
    const user = await (prisma as any).user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    targetUserId = user.id;
  }
  if (!targetUserId) return NextResponse.json({ error: 'inviteUserId or email required' }, { status: 400 });

  const existing = await (prisma as any).organizationMember.findFirst({ where: { organizationId: params.id, userId: targetUserId } });
  if (existing) return NextResponse.json({ error: 'Already a member' }, { status: 409 });

  const member = await (prisma as any).organizationMember.create({
    data: { organizationId: params.id, userId: targetUserId, role: role || 'VIEWER', status: 'INVITED', invitedByUserId: userId },
  });

  return NextResponse.json({ member }, { status: 201 });
}
