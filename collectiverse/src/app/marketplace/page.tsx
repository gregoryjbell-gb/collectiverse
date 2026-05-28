'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MarketplacePage() {
  const [listings, setListings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    params.set('page', String(page));
    fetch(`/api/marketplace?${params}`)
      .then(r => r.json())
      .then(d => { setListings(d.listings || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [search, page]);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
        <p className="text-silver text-sm mb-6">{total} active listings</p>

        <div className="mb-6">
          <input type="search" className="input-field max-w-md" placeholder="Search listings..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>

        {loading ? <div className="text-silver text-center py-12">Loading...</div> : listings.length === 0 ? (
          <div className="card-surface p-12 text-center"><p className="text-silver">No active listings.</p></div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((l: any) => (
              <Link key={l.id} href={`/marketplace/${l.id}`} className="card-surface p-5 hover:border-electric/30 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold group-hover:text-electric transition-colors">
                      {l.item?.playerName || l.item?.name || 'Listing'}
                    </p>
                    <p className="text-xs text-silver">
                      {l.item?.setName && `${l.item.setName} `}
                      {l.item?.cardNumber && `#${l.item.cardNumber} `}
                      {l.item?.year && `(${l.item.year})`}
                    </p>
                  </div>
                  {l.price && <span className="text-electric font-bold">${l.price}</span>}
                </div>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  <span className="badge bg-electric/20 text-electric text-xs">{l.listingType}</span>
                  {l.item?.condition && l.item.condition !== 'RAW' && <span className="badge bg-silver/10 text-silver text-xs">{l.item.gradeCompany} {l.item.gradeValue}</span>}
                  {l.allowOffers && <span className="badge bg-green-500/20 text-green-400 text-xs">Offers</span>}
                  {l.allowTrades && <span className="badge bg-purple-500/20 text-purple-400 text-xs">Trades</span>}
                </div>
                <p className="text-xs text-silver">by {l.seller}</p>
              </Link>
            ))}
          </div>
        )}

        {total > 25 && (
          <div className="flex justify-center gap-2 mt-6">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary text-xs px-3 py-1 disabled:opacity-50">Prev</button>
            <span className="text-silver text-sm py-1">Page {page}</span>
            <button onClick={() => setPage(page + 1)} disabled={listings.length < 25} className="btn-secondary text-xs px-3 py-1 disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </main>
  );
}
