'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MusicPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (q?: string) => {
    setLoading(true);
    fetch(`/api/music${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setItems(d.items || []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Vinyl &amp; Music</h1>
          <Link href="/inventory/add/select-type" className="btn-primary text-sm">+ Add to Collection</Link>
        </div>
        <form onSubmit={e => { e.preventDefault(); load(search); }} className="flex gap-3 mb-6">
          <input className="input-field flex-1" placeholder="Search by artist, album, label..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn-primary text-sm">Search</button>
        </form>
        {loading ? <div className="text-silver text-center">Loading...</div> : items.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Music Collectibles Yet</h2>
            <p className="text-silver text-sm mb-4">Vinyl records, CDs, cassettes, signed albums, and music memorabilia will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((m: any) => (
              <div key={m.id} className="card-surface p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{m.artistName}{m.albumTitle ? ` — ${m.albumTitle}` : ''}</p>
                    <p className="text-xs text-silver">{m.musicType.replace(/_/g, ' ')}{m.format ? ` • ${m.format}` : ''}{m.pressing ? ` • ${m.pressing}` : ''}{m.label ? ` • ${m.label}` : ''}{m.releaseYear ? ` • ${m.releaseYear}` : ''}</p>
                  </div>
                  <div className="flex gap-1">
                    {m.signed && <span className="badge bg-purple-400/20 text-purple-400 text-xs">Signed</span>}
                    {m.coloredVinyl && <span className="badge bg-electric/20 text-electric text-xs">Colored</span>}
                    {m.limitedEdition && <span className="badge bg-amber-400/20 text-amber-400 text-xs">Limited</span>}
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
