'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CoinsPage() {
  const [coins, setCoins] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (q?: string) => {
    setLoading(true);
    fetch(`/api/coins${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setCoins(d.coins || []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Coins</h1>
          <Link href="/inventory/add/select-type" className="btn-primary text-sm">+ Add to Collection</Link>
        </div>
        <form onSubmit={e => { e.preventDefault(); load(search); }} className="flex gap-3 mb-6">
          <input className="input-field flex-1" placeholder="Search by denomination, series, country..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn-primary text-sm">Search</button>
        </form>
        {loading ? <div className="text-silver text-center">Loading...</div> : coins.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Coins Yet</h2>
            <p className="text-silver text-sm mb-4">Coins, bullion, tokens, medals, and numismatic items will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {coins.map((c: any) => (
              <div key={c.id} className="card-surface p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{c.year || ''} {c.denomination || ''} {c.seriesName || c.country}</p>
                    <p className="text-xs text-silver">{c.coinType.replace(/_/g, ' ')}{c.mintMark ? ` • ${c.mintMark}` : ''}{c.certificationCompany ? ` • ${c.certificationCompany} ${c.gradeValue || ''}` : ''}</p>
                  </div>
                  <div className="flex gap-1">
                    {c.proof && <span className="badge bg-purple-400/20 text-purple-400 text-xs">Proof</span>}
                    {c.errorCoin && <span className="badge bg-red-400/20 text-red-400 text-xs">Error</span>}
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
