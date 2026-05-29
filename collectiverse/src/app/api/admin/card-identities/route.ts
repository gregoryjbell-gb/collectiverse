import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;

  const where: any = {};
  if (search) {
    where.OR = [
      { subjectName: { contains: search, mode: 'insensitive' } },
      { setName: { contains: search, mode: 'insensitive' } },
      { fingerprint: { contains: search.toLowerCase() } },
    ];
  }

  const [identities, total] = await Promise.all([
    (prisma as any).cardIdentity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    (prisma as any).cardIdentity.count({ where }),
  ]);

  return NextResponse.json({ identities, total, page, pages: Math.ceil(total / limit) });
}
