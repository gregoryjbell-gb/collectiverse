'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

export default function CardsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen py-12 px-6 text-silver text-center">Loading...</div>}>
      <CardsPage />
    </Suspense>
  );
}

interface CardItem {
  id: string;
  playerName: string;
  personId: string | null;
  cardNumber: string | null;
  year: number | null;
  setName: string;
  manufacturer: string;
  sport: string;
  teamName: string;
  rookie: boolean;
  autograph: boolean;
  relic: boolean;
  parallel: string | null;
  estimatedValue: number | null;
  frontImageUrl: string | null;
  cardCategory: string;
  franchise: string | null;
  characterName: string | null;
  actorName: string | null;
  artistName: string | null;
  subjectName: string | null;
  universe: string | null;
  genre: string | null;
}

function CardsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<CardItem[]>([]);
  const [featured, setFeatured] = useState<CardItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Read state from URL
  const q = searchParams.get('q') || '';
  const sport = searchParams.get('sport') || '';
  const year = searchParams.get('year') || '';
  const manufacturer = searchParams.get('manufacturer') || '';
  const rookie = searchParams.get('rookie') || '';
  const autograph = searchParams.get('autograph') || '';
  const relic = searchParams.get('relic') || '';
  const cardCategory = searchParams.get('cardCategory') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '25');

  // Local form state for controlled inputs
  const [searchInput, setSearchInput] = useState(q);

  // Load featured cards once
  useEffect(() => {
    fetch('/api/cards/list?sort=value_high&pageSize=6')
      .then(r => r.json())
      .then(d => setFeatured(d.items || []))
      .catch(() => {});
  }, []);

  // Load main results
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (sport) params.set('sport', sport);
    if (year) params.set('year', year);
    if (manufacturer) params.set('manufacturer', manufacturer);
    if (rookie) params.set('rookie', rookie);
    if (autograph) params.set('autograph', autograph);
    if (relic) params.set('relic', relic);
    if (cardCategory) params.set('cardCategory', cardCategory);
    params.set('sort', sort);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));

    fetch(`/api/cards/list?${params}`)
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setTotal(d.total || 0); setTotalPages(d.totalPages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, sport, year, manufacturer, rookie, autograph, relic, sort, page, pageSize]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v); else params.delete(k);
    }
    if (!updates.page) params.set('page', '1'); // Reset page on filter change
    router.push(`/cards?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: searchInput });
  };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Cards</h1>

        {/* Featured Cards */}
        {!q && !sport && !year && page === 1 && featured.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-silver mb-4">Featured</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.slice(0, 6).map(card => (
                <Link key={card.id} href={`/cards/${card.id}`} className="card-surface p-5 hover:border-electric/30 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold group-hover:text-electric transition-colors">{card.playerName}</p>
                      <p className="text-sm text-silver">{card.setName} #{card.cardNumber}</p>
                    </div>
                    {card.estimatedValue && <span className="text-electric font-bold text-sm">${card.estimatedValue.toLocaleString()}</span>}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {card.rookie && <span className="badge bg-amber-500/20 text-amber-400 text-xs">RC</span>}
                    {card.autograph && <span className="badge bg-purple-500/20 text-purple-400 text-xs">Auto</span>}
                    {card.parallel && <span className="badge bg-electric/20 text-electric text-xs">{card.parallel}</span>}
                    <span className="badge bg-silver/10 text-silver text-xs">{card.sport}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Search & Filters */}
        <div className="card-surface p-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-3 mb-3 flex-wrap">
            <input type="search" className="input-field flex-1 min-w-[200px]" placeholder="Search player, set, team, card #..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
            <button type="submit" className="btn-primary text-sm">Search</button>
          </form>
          <div className="flex flex-wrap gap-2">
            <select className="input-field w-auto text-sm" value={cardCategory} onChange={e => updateParams({ cardCategory: e.target.value })}>
              <option value="">All Categories</option>
              <option value="SPORTS">Sports</option>
              <option value="TCG">TCG</option>
              <option value="ENTERTAINMENT">Entertainment</option>
              <option value="MOVIE_TV">Movie/TV</option>
              <option value="MUSIC">Music</option>
              <option value="COMIC_RELATED">Comics</option>
              <option value="HISTORY">History</option>
              <option value="GAMING">Gaming</option>
              <option value="OTHER">Other</option>
            </select>
            <select className="input-field w-auto text-sm" value={sport} onChange={e => updateParams({ sport: e.target.value })}>
              <option value="">All Sports</option>
              <option value="NFL">NFL</option>
              <option value="NBA">NBA</option>
              <option value="MLB">MLB</option>
            </select>
            <input type="number" className="input-field w-24 text-sm" placeholder="Year" value={year} onChange={e => updateParams({ year: e.target.value })} />
            <input className="input-field w-32 text-sm" placeholder="Manufacturer" value={manufacturer} onChange={e => updateParams({ manufacturer: e.target.value })} />
            <label className="flex items-center gap-1 text-xs text-silver cursor-pointer">
              <input type="checkbox" checked={rookie === 'true'} onChange={e => updateParams({ rookie: e.target.checked ? 'true' : '' })} /> RC
            </label>
            <label className="flex items-center gap-1 text-xs text-silver cursor-pointer">
              <input type="checkbox" checked={autograph === 'true'} onChange={e => updateParams({ autograph: e.target.checked ? 'true' : '' })} /> Auto
            </label>
            <label className="flex items-center gap-1 text-xs text-silver cursor-pointer">
              <input type="checkbox" checked={relic === 'true'} onChange={e => updateParams({ relic: e.target.checked ? 'true' : '' })} /> Relic
            </label>
            <select className="input-field w-auto text-sm" value={sort} onChange={e => updateParams({ sort: e.target.value })}>
              <option value="newest">Newest</option>
              <option value="year_asc">Year ↑</option>
              <option value="year_desc">Year ↓</option>
              <option value="player_az">Player A-Z</option>
              <option value="value_high">Value High-Low</option>
              <option value="value_low">Value Low-High</option>
            </select>
            {(q || sport || year || manufacturer || rookie || autograph || relic || cardCategory) && (
              <button onClick={() => { setSearchInput(''); router.push('/cards'); }} className="text-xs text-red-400 hover:underline">Clear All</button>
            )}
          </div>
        </div>

        {/* Results info */}
        <div className="flex justify-between items-center mb-3">
          <p className="text-silver text-sm">{total} cards found</p>
          <select className="input-field w-auto text-xs" value={pageSize} onChange={e => updateParams({ pageSize: e.target.value, page: '1' })}>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>

        {/* Results Table */}
        {loading ? (
          <div className="text-silver text-center py-12">Loading...</div>
        ) : items.length === 0 ? (
          <div className="card-surface p-12 text-center">
            <p className="text-silver text-lg">No cards found</p>
            <button onClick={() => { setSearchInput(''); router.push('/cards'); }} className="text-electric hover:underline mt-2 text-sm">Clear filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silver/20 text-left text-silver text-xs">
                  <th className="py-2 px-2">Year</th>
                  <th className="py-2 px-2">Subject</th>
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Set</th>
                  <th className="py-2 px-2">Mfr</th>
                  <th className="py-2 px-2">Team</th>
                  <th className="py-2 px-2">Attrs</th>
                  <th className="py-2 px-2">Value</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(card => (
                  <tr key={card.id} className="border-b border-silver/10 hover:bg-silver/5 transition-colors">
                    <td className="py-2 px-2 text-silver">{card.year || '—'}</td>
                    <td className="py-2 px-2 font-medium">{card.playerName || card.characterName || card.actorName || card.artistName || card.subjectName || '—'}</td>
                    <td className="py-2 px-2 text-silver">{card.cardNumber || '—'}</td>
                    <td className="py-2 px-2 text-silver text-xs">{card.setName}</td>
                    <td className="py-2 px-2 text-silver text-xs">{card.manufacturer || '—'}</td>
                    <td className="py-2 px-2 text-silver text-xs">{card.teamName || '—'}</td>
                    <td className="py-2 px-2">
                      <div className="flex gap-1">
                        {card.rookie && <span className="badge bg-amber-500/20 text-amber-400 text-[10px]">RC</span>}
                        {card.autograph && <span className="badge bg-purple-500/20 text-purple-400 text-[10px]">Auto</span>}
                        {card.relic && <span className="badge bg-green-500/20 text-green-400 text-[10px]">Relic</span>}
                        {card.parallel && <span className="badge bg-electric/20 text-electric text-[10px]">{card.parallel}</span>}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-electric font-medium">{card.estimatedValue ? `$${card.estimatedValue.toLocaleString()}` : '—'}</td>
                    <td className="py-2 px-2">
                      <div className="flex gap-2">
                        <Link href={`/cards/${card.id}`} className="text-electric text-xs hover:underline">View</Link>
                        <Link href={`/inventory/add?cardId=${card.id}`} className="text-silver text-xs hover:underline">+ Inv</Link>
                      </div>
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
