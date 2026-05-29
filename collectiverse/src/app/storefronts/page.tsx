'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StorefrontsPage() {
  const [storefronts, setStorefronts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch('/api/storefronts').then(r => r.json()).then(d => setStorefronts(d.storefronts || [])).finally(() => setLoading(false)); }, []);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Storefronts</h1>
        {storefronts.length === 0 ? (
          <div className="card-surface p-8 text-center"><p className="text-silver">No active storefronts yet.</p></div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {storefronts.map((s: any) => (
              <Link key={s.id} href={`/storefronts/${s.slug}`} className="card-surface p-5 hover:border-electric/30 transition-colors">
                <p className="font-bold">{s.displayName}</p>
                {s.tagline && <p className="text-silver text-sm mt-1">{s.tagline}</p>}
                {s.featured && <span className="badge bg-electric/20 text-electric text-xs mt-2 inline-block">Featured</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
