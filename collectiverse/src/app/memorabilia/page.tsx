'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MemorabiliaPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (q?: string) => {
    setLoading(true);
    fetch(`/api/memorabilia${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setItems(d.items || []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Memorabilia</h1>
          <Link href="/inventory/add/select-type" className="btn-primary text-sm">+ Add to Collection</Link>
        </div>
        <form onSubmit={e => { e.preventDefault(); load(search); }} className="flex gap-3 mb-6">
          <input className="input-field flex-1" placeholder="Search by subject, team, event..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn-primary text-sm">Search</button>
        </form>
        {loading ? <div className="text-silver text-center">Loading...</div> : items.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Memorabilia Yet</h2>
            <p className="text-silver text-sm mb-4">Autographs, jerseys, game-used items, and authenticated memorabilia will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className="card-surface p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{item.subjectName || 'Item'} — {item.itemType.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-silver">{[item.team, item.sport, item.authenticationCompany].filter(Boolean).join(' • ')}</p>
                  </div>
                  <div className="flex gap-1">
                    {item.signed && <span className="badge bg-purple-400/20 text-purple-400 text-xs">Signed</span>}
                    {item.gameUsed && <span className="badge bg-green-400/20 text-green-400 text-xs">Game Used</span>}
                    {item.limitedEdition && <span className="badge bg-amber-400/20 text-amber-400 text-xs">Limited</span>}
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
