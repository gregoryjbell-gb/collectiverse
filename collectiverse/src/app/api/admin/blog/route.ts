import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const posts = await (prisma as any).blogPost.findMany({
    orderBy: { createdAt: 'desc' },
    include: { categories: { include: { category: true } }, tags: { include: { tag: true } } },
    take: 50,
  });
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const { title, slug, excerpt, body: postBody, status, featuredImageUrl, seoTitle, seoDescription, categoryIds, tagNames } = body;
  if (!title || !slug) return NextResponse.json({ error: 'title and slug required' }, { status: 400 });

  const post = await (prisma as any).blogPost.create({
    data: {
      title, slug, excerpt: excerpt || null, body: postBody || null,
      status: status || 'draft', authorId: userId,
      featuredImageUrl: featuredImageUrl || null, seoTitle: seoTitle || null, seoDescription: seoDescription || null,
      publishedAt: status === 'published' ? new Date() : null,
    },
  });

  // Link categories
  if (categoryIds?.length) {
    for (const catId of categoryIds) {
      await (prisma as any).blogPostCategory.create({ data: { blogPostId: post.id, blogCategoryId: catId } }).catch(() => {});
    }
  }

  // Create and link tags
  if (tagNames?.length) {
    for (const name of tagNames) {
      const tagSlug = name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
      let tag = await (prisma as any).blogTag.findUnique({ where: { slug: tagSlug } });
      if (!tag) tag = await (prisma as any).blogTag.create({ data: { name, slug: tagSlug } });
      await (prisma as any).blogPostTag.create({ data: { blogPostId: post.id, blogTagId: tag.id } }).catch(() => {});
    }
  }

  return NextResponse.json({ post }, { status: 201 });
}
