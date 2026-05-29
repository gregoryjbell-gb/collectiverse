import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { requireFeature } from '@/lib/membership';

export async function GET() {
  const storefronts = await (prisma as any).storefront.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ featured: 'desc' }, { displayName: 'asc' }],
    take: 50,
  });
  return NextResponse.json({ storefronts });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const check = await requireFeature(userId, 'STOREFRONT');
  if (!check.allowed) return NextResponse.json({ error: check.message, upgrade: true }, { status: 403 });

  const existing = await (prisma as any).storefront.findUnique({ where: { userId } });
  if (existing) return NextResponse.json({ storefront: existing });

  const body = await req.json();
  const { slug, displayName, tagline, description } = body;
  if (!slug || !displayName) return NextResponse.json({ error: 'slug and displayName required' }, { status: 400 });

  const storefront = await (prisma as any).storefront.create({
    data: { userId, slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ''), displayName, tagline: tagline || null, description: description || null, status: 'ACTIVE' },
  });

  return NextResponse.json({ storefront }, { status: 201 });
}
