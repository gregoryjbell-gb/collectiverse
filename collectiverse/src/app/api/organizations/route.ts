import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const memberships = await (prisma as any).organizationMember.findMany({
    where: { userId, status: 'ACTIVE' },
    include: { organization: true },
  });

  return NextResponse.json({ organizations: memberships.map((m: any) => ({ ...m.organization, role: m.role })) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const { name, slug, organizationType } = body;
  if (!name || !slug) return NextResponse.json({ error: 'name and slug required' }, { status: 400 });

  const org = await (prisma as any).organization.create({
    data: { ownerUserId: userId, name, slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ''), organizationType: organizationType || 'DEALER' },
  });

  // Add owner as member
  await (prisma as any).organizationMember.create({
    data: { organizationId: org.id, userId, role: 'OWNER', status: 'ACTIVE', joinedAt: new Date() },
  });

  return NextResponse.json({ organization: org }, { status: 201 });
}
