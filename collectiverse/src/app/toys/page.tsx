'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ToysPage() {
  const [toys, setToys] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (q?: string) => {
    setLoading(true);
    fetch(`/api/toys${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setToys(d.toys || []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Toys &amp; Figures</h1>
          <Link href="/inventory/add/select-type" className="btn-primary text-sm">+ Add to Collection</Link>
        </div>
        <form onSubmit={e => { e.preventDefault(); load(search); }} className="flex gap-3 mb-6">
          <input className="input-field flex-1" placeholder="Search by name, franchise, character, brand..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn-primary text-sm">Search</button>
        </form>
        {loading ? <div className="text-silver text-center">Loading...</div> : toys.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Toys Yet</h2>
            <p className="text-silver text-sm mb-4">Action figures, Funko Pops, statues, LEGO sets, and other toy collectibles will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {toys.map((t: any) => (
              <div key={t.id} className="card-surface p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{t.characterName || t.name}</p>
                    <p className="text-xs text-silver">{t.toyType.replace(/_/g, ' ')}{t.franchise ? ` • ${t.franchise}` : ''}{t.manufacturer ? ` • ${t.manufacturer}` : ''}{t.series ? ` • ${t.series}` : ''}</p>
                  </div>
                  <div className="flex gap-1">
                    {t.sealed && <span className="badge bg-green-400/20 text-green-400 text-xs">Sealed</span>}
                    {t.completeInBox && <span className="badge bg-blue-400/20 text-blue-400 text-xs">CIB</span>}
                    {t.limitedEdition && <span className="badge bg-amber-400/20 text-amber-400 text-xs">Limited</span>}
                    {t.exclusiveRetailer && <span className="badge bg-purple-400/20 text-purple-400 text-xs">{t.exclusiveRetailer}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
