'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function StorefrontPage() {
  const { slug } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(`/api/storefronts/${slug}`).then(r => r.ok ? r.json() : null).then(d => { if (d) setData(d); }).finally(() => setLoading(false)); }, [slug]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return <main className="min-h-screen py-12 px-6"><div className="text-center"><p className="text-silver">Storefront not found.</p><Link href="/storefronts" className="text-electric">Browse Storefronts</Link></div></main>;

  const { storefront, listings, liveEvents, reputation } = data;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/storefronts" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; All Storefronts</Link>
        {storefront.bannerUrl && <img src={storefront.bannerUrl} alt="" className="w-full h-40 object-cover rounded-lg mb-4" />}
        <div className="flex items-center gap-4 mb-6">
          {storefront.logoUrl && <img src={storefront.logoUrl} alt="" className="w-16 h-16 rounded-full" />}
          <div>
            <h1 className="text-2xl font-bold">{storefront.displayName}</h1>
            {storefront.tagline && <p className="text-silver">{storefront.tagline}</p>}
            {reputation && <p className="text-xs text-silver mt-1">{reputation.positiveFeedback} positive • {reputation.completedTransfers} sales</p>}
          </div>
        </div>
        {storefront.description && <p className="text-silver text-sm mb-6">{storefront.description}</p>}

        {liveEvents?.length > 0 && (
          <section className="mb-6">
            <h2 className="font-semibold mb-3">Live Events</h2>
            <div className="space-y-2">
              {liveEvents.map((e: any) => (
                <Link key={e.id} href={`/live/${e.id}`} className="card-surface p-3 hover:border-electric/30 transition-colors block">
                  <p className="text-sm font-medium">{e.title}</p>
                  <span className={`badge text-xs ${e.status === 'LIVE' ? 'bg-red-400/20 text-red-400' : 'bg-blue-400/20 text-blue-400'}`}>{e.status}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-semibold mb-3">Listings ({listings?.length || 0})</h2>
          {listings?.length > 0 ? (
            <div className="space-y-2">
              {listings.map((l: any) => (
                <Link key={l.id} href={`/marketplace/${l.id}`} className="card-surface p-3 hover:border-electric/30 transition-colors block flex justify-between items-center">
                  <p className="text-sm">{l.description || `Listing #${l.id.slice(-8)}`}</p>
                  {l.price && <span className="text-electric font-bold text-sm">${l.price}</span>}
                </Link>
              ))}
            </div>
          ) : <p className="text-silver text-sm">No active listings.</p>}
        </section>
      </div>
    </main>
  );
}
