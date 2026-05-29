'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VideoGamesPage() {
  const [games, setGames] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (q?: string) => {
    setLoading(true);
    fetch(`/api/video-games${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setGames(d.games || []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Video Games</h1>
          <Link href="/inventory/add/select-type" className="btn-primary text-sm">+ Add to Collection</Link>
        </div>
        <form onSubmit={e => { e.preventDefault(); load(search); }} className="flex gap-3 mb-6">
          <input className="input-field flex-1" placeholder="Search by title, platform, publisher..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn-primary text-sm">Search</button>
        </form>
        {loading ? <div className="text-silver text-center">Loading...</div> : games.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Video Games Yet</h2>
            <p className="text-silver text-sm mb-4">Graded games, sealed games, CIB games, and retro collectibles will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {games.map((g: any) => (
              <div key={g.id} className="card-surface p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{g.title}</p>
                    <p className="text-xs text-silver">{g.platform}{g.publisher ? ` • ${g.publisher}` : ''}{g.releaseYear ? ` • ${g.releaseYear}` : ''} • {g.region}</p>
                  </div>
                  <div className="flex gap-1">
                    {g.sealed && <span className="badge bg-green-400/20 text-green-400 text-xs">Sealed</span>}
                    {g.completeInBox && <span className="badge bg-blue-400/20 text-blue-400 text-xs">CIB</span>}
                    {g.gradingCompany && <span className="badge bg-purple-400/20 text-purple-400 text-xs">{g.gradingCompany} {g.gradeValue}</span>}
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
