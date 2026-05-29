import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const tag = searchParams.get('tag');

  const where: any = { status: 'published' };
  if (category) where.categories = { some: { category: { slug: category } } };
  if (tag) where.tags = { some: { tag: { slug: tag } } };

  const posts = await (prisma as any).blogPost.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    include: { categories: { include: { category: true } }, tags: { include: { tag: true } } },
    take: 20,
  });

  return NextResponse.json({ posts });
}
