'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog').then(r => r.ok ? r.json() : null).then(d => { if (d) setPosts(d.posts || []); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Blog</h1>
        {posts.length === 0 ? (
          <div className="card-surface p-8 text-center"><p className="text-silver">No posts yet. Check back soon.</p></div>
        ) : (
          <div className="space-y-6">
            {posts.map((post: any) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="card-surface p-6 hover:border-electric/30 transition-colors block">
                {post.featuredImageUrl && <img src={post.featuredImageUrl} alt={post.title} className="w-full h-48 object-cover rounded-lg mb-4" />}
                <h2 className="text-xl font-bold group-hover:text-electric">{post.title}</h2>
                {post.excerpt && <p className="text-silver text-sm mt-2">{post.excerpt}</p>}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {post.categories?.map((pc: any) => <span key={pc.id} className="badge bg-electric/20 text-electric text-xs">{pc.category.name}</span>)}
                  {post.tags?.map((pt: any) => <span key={pt.id} className="badge bg-silver/10 text-silver text-xs">#{pt.tag.name}</span>)}
                </div>
                {post.publishedAt && <p className="text-xs text-silver mt-2">{new Date(post.publishedAt).toLocaleDateString()}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
