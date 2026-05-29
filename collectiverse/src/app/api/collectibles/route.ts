import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const type = searchParams.get('type');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;

  const where: any = {};
  if (q) where.title = { contains: q, mode: 'insensitive' };
  if (type) where.collectibleType = type;
  where.status = 'ACTIVE';

  const [collectibles, total] = await Promise.all([
    (prisma as any).collectible.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    (prisma as any).collectible.count({ where }),
  ]);

  return NextResponse.json({ collectibles, total, page, pages: Math.ceil(total / limit) });
}
