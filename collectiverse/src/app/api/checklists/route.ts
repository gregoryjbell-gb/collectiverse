import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productReleaseId = searchParams.get('productReleaseId');

  const where: any = {};
  if (productReleaseId) where.productReleaseId = productReleaseId;

  const checklists = await (prisma as any).checklist.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { cards: true, parallels: true, inserts: true } },
    },
    take: 50,
  });

  return NextResponse.json({ checklists });
}
