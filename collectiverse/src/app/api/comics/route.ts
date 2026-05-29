import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const publisher = searchParams.get('publisher');

  const where: any = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { issueNumber: { contains: q } },
      { writer: { contains: q, mode: 'insensitive' } },
      { artist: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (publisher) where.publisher = { contains: publisher, mode: 'insensitive' };

  const issues = await (prisma as any).comicIssue.findMany({
    where,
    include: { comicSeries: { select: { title: true, publisher: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ issues });
}
