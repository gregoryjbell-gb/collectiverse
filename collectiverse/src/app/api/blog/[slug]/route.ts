import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const post = await (prisma as any).blogPost.findFirst({
    where: { slug: params.slug, status: 'published' },
    include: { categories: { include: { category: true } }, tags: { include: { tag: true } } },
  });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const author = await (prisma as any).user.findUnique({ where: { id: post.authorId }, select: { displayName: true, username: true } });

  return NextResponse.json({ post, author: author?.displayName || author?.username || 'Collectiverse' });
}
