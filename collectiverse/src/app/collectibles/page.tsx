'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const TYPES = ['', 'SPORTS_CARD', 'TCG_CARD', 'NON_SPORTS_CARD', 'COMIC_BOOK', 'SEALED_PRODUCT', 'MEMORABILIA', 'TICKET', 'COIN', 'VIDEO_GAME', 'OTHER'];

export default function CollectiblesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (type) params.set('type', type);
    fetch(`/api/collectibles?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setItems(d.collectibles || []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [type]);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Collectibles</h1>

        <div className="flex gap-3 mb-6 flex-wrap">
          <form onSubmit={e => { e.preventDefault(); load(); }} className="flex gap-2 flex-1">
            <input className="input-field flex-1" placeholder="Search collectibles..." value={search} onChange={e => setSearch(e.target.value)} />
            <button type="submit" className="btn-primary text-sm">Search</button>
          </form>
          <select className="input-field w-auto text-sm" value={type} onChange={e => setType(e.target.value)}>
            <option value="">All Types</option>
            {TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        {loading ? <div className="text-silver text-center">Loading...</div> : items.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <p className="text-silver">No collectibles found. Try a different search or filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item: any) => (
              <Link key={item.id} href={`/collectibles/${item.id}`} className="card-surface p-4 hover:border-electric/30 transition-colors block">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-silver">{item.manufacturer || ''}{item.year ? ` • ${item.year}` : ''}{item.franchise ? ` • ${item.franchise}` : ''}</p>
                  </div>
                  <span className="badge bg-silver/10 text-silver text-xs">{item.collectibleType.replace(/_/g, ' ')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
