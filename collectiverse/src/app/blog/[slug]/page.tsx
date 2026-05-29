'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/blog/${slug}`).then(r => r.ok ? r.json() : null).then(d => { if (d) setData(d); }).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return <main className="min-h-screen py-12 px-6"><div className="text-center"><p className="text-silver">Post not found.</p><Link href="/blog" className="text-electric">Back to Blog</Link></div></main>;

  const { post, author } = data;

  return (
    <main className="min-h-screen py-12 px-6">
      <article className="max-w-3xl mx-auto">
        <Link href="/blog" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Blog</Link>
        {post.featuredImageUrl && <img src={post.featuredImageUrl} alt={post.title} className="w-full rounded-lg mb-6" />}
        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
        <div className="flex items-center gap-3 text-sm text-silver mb-6">
          <span>By {author}</span>
          {post.publishedAt && <span>• {new Date(post.publishedAt).toLocaleDateString()}</span>}
        </div>
        <div className="flex gap-2 mb-6 flex-wrap">
          {post.categories?.map((pc: any) => <Link key={pc.id} href={`/blog?category=${pc.category.slug}`} className="badge bg-electric/20 text-electric text-xs">{pc.category.name}</Link>)}
          {post.tags?.map((pt: any) => <Link key={pt.id} href={`/blog?tag=${pt.tag.slug}`} className="badge bg-silver/10 text-silver text-xs">#{pt.tag.name}</Link>)}
        </div>
        <div className="prose prose-invert max-w-none text-silver leading-relaxed whitespace-pre-wrap">{post.body || ''}</div>
      </article>
    </main>
  );
}
