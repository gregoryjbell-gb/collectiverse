'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PlayersPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen py-12 px-6 text-silver text-center">Loading...</div>}>
      <PlayersPage />
    </Suspense>
  );
}

interface PlayerItem {
  id: string;
  displayName: string;
  hallOfFame: boolean;
  sports: string[];
  cardCount: number;
  biography: string | null;
}

function PlayersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<PlayerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get('q') || '';
  const sport = searchParams.get('sport') || '';
  const hof = searchParams.get('hof') || '';
  const sort = searchParams.get('sort') || 'name_az';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '25');

  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (sport) params.set('sport', sport);
    if (hof) params.set('hof', hof);
    params.set('sort', sort);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));

    fetch(`/api/players/list?${params}`)
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setTotal(d.total || 0); setTotalPages(d.totalPages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, sport, hof, sort, page, pageSize]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v); else params.delete(k);
    }
    if (!updates.page) params.set('page', '1');
    router.push(`/players?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); updateParams({ q: searchInput }); };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Players</h1>

        {/* Search & Filters */}
        <div className="card-surface p-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-3 mb-3 flex-wrap">
            <input type="search" className="input-field flex-1 min-w-[200px]" placeholder="Search players..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
            <button type="submit" className="btn-primary text-sm">Search</button>
          </form>
          <div className="flex flex-wrap gap-2">
            <select className="input-field w-auto text-sm" value={sport} onChange={e => updateParams({ sport: e.target.value })}>
              <option value="">All Sports</option>
              <option value="NFL">NFL</option>
              <option value="NBA">NBA</option>
              <option value="MLB">MLB</option>
            </select>
            <label className="flex items-center gap-1 text-xs text-silver cursor-pointer">
              <input type="checkbox" checked={hof === 'true'} onChange={e => updateParams({ hof: e.target.checked ? 'true' : '' })} /> Hall of Fame Only
            </label>
            <select className="input-field w-auto text-sm" value={sort} onChange={e => updateParams({ sort: e.target.value })}>
              <option value="name_az">Name A-Z</option>
              <option value="name_za">Name Z-A</option>
              <option value="newest">Newest</option>
            </select>
            {(q || sport || hof) && (
              <button onClick={() => { setSearchInput(''); router.push('/players'); }} className="text-xs text-red-400 hover:underline">Clear All</button>
            )}
          </div>
        </div>

        {/* Results info */}
        <div className="flex justify-between items-center mb-3">
          <p className="text-silver text-sm">{total} players</p>
          <select className="input-field w-auto text-xs" value={pageSize} onChange={e => updateParams({ pageSize: e.target.value, page: '1' })}>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-silver text-center py-12">Loading...</div>
        ) : items.length === 0 ? (
          <div className="card-surface p-12 text-center">
            <p className="text-silver text-lg">No players found</p>
            <button onClick={() => { setSearchInput(''); router.push('/players'); }} className="text-electric hover:underline mt-2 text-sm">Clear filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silver/20 text-left text-silver text-xs">
                  <th className="py-2 px-2">Name</th>
                  <th className="py-2 px-2">Sports</th>
                  <th className="py-2 px-2">HOF</th>
                  <th className="py-2 px-2">Cards</th>
                  <th className="py-2 px-2">Bio</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(player => (
                  <tr key={player.id} className="border-b border-silver/10 hover:bg-silver/5 transition-colors">
                    <td className="py-2 px-2 font-medium">{player.displayName}</td>
                    <td className="py-2 px-2">
                      <div className="flex gap-1">
                        {player.sports.map(s => <span key={s} className="badge bg-electric/20 text-electric text-[10px]">{s}</span>)}
                      </div>
                    </td>
                    <td className="py-2 px-2">{player.hallOfFame ? <span className="text-amber-400">✓</span> : '—'}</td>
                    <td className="py-2 px-2 text-silver">{player.cardCount}</td>
                    <td className="py-2 px-2 text-silver text-xs max-w-[200px] truncate">{player.biography || '—'}</td>
                    <td className="py-2 px-2">
                      <Link href={`/players/${player.id}`} className="text-electric text-xs hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button onClick={() => updateParams({ page: '1' })} disabled={page === 1} className="btn-secondary text-xs px-2 py-1 disabled:opacity-50">First</button>
            <button onClick={() => updateParams({ page: String(page - 1) })} disabled={page === 1} className="btn-secondary text-xs px-2 py-1 disabled:opacity-50">Prev</button>
            <span className="text-silver text-sm px-3">Page {page} of {totalPages}</span>
            <button onClick={() => updateParams({ page: String(page + 1) })} disabled={page === totalPages} className="btn-secondary text-xs px-2 py-1 disabled:opacity-50">Next</button>
            <button onClick={() => updateParams({ page: String(totalPages) })} disabled={page === totalPages} className="btn-secondary text-xs px-2 py-1 disabled:opacity-50">Last</button>
          </div>
        )}
      </div>
    </main>
  );
}
