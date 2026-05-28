'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SearchPageWrapper() {
  return <Suspense fallback={<div className="min-h-screen py-12 px-6 text-silver text-center">Loading...</div>}><SearchPage /></Suspense>;
}

const TYPE_LABELS: Record<string, string> = { ALL: 'All', CARDS: 'Cards', SETS: 'Sets', LISTINGS: 'Marketplace', INVENTORY: 'My Inventory', GROUPS: 'My Groups', WISHLIST: 'Wishlist', USERS: 'Users' };
const TYPE_COLORS: Record<string, string> = { CARDS: 'bg-electric/20 text-electric', SETS: 'bg-green-500/20 text-green-400', LISTINGS: 'bg-amber-500/20 text-amber-400', INVENTORY: 'bg-purple-500/20 text-purple-400', GROUPS: 'bg-purple-500/20 text-purple-400', WISHLIST: 'bg-red-500/20 text-red-400', USERS: 'bg-silver/20 text-silver' };

function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'ALL';

  const [searchInput, setSearchInput] = useState(q);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) { setResults(null); return; }
    setLoading(true);
    fetch(`/api/search/global?q=${encodeURIComponent(q)}&type=${type}`)
      .then(r => r.json())
      .then(d => setResults(d))
      .finally(() => setLoading(false));
  }, [q, type]);

  const doSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) router.push(`/search?q=${encodeURIComponent(searchInput)}&type=${type}`);
  };

  const setType = (t: string) => router.push(`/search?q=${encodeURIComponent(q)}&type=${t}`);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Search</h1>

        <form onSubmit={doSearch} className="flex gap-3 mb-6">
          <input type="search" className="input-field flex-1" placeholder="Search cards, sets, players, listings, inventory..." value={searchInput} onChange={e => setSearchInput(e.target.value)} autoFocus />
          <button type="submit" className="btn-primary">Search</button>
        </form>

        {q && (
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => setType(key)} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${type === key ? 'bg-electric text-white' : 'bg-gunmetal/50 text-silver hover:text-white'}`}>{label}</button>
            ))}
          </div>
        )}

        {loading && <div className="text-silver text-center py-8">Searching...</div>}

        {results && !loading && (
          <>
            <p className="text-silver text-sm mb-4">{results.total} results for &ldquo;{results.query}&rdquo;</p>
            {results.sections.length === 0 ? (
              <div className="card-surface p-8 text-center"><p className="text-silver">No results found.</p></div>
            ) : (
              <div className="space-y-6">
                {results.sections.map((section: any) => (
                  <div key={section.type}>
                    <h2 className="text-sm font-semibold text-silver uppercase tracking-wider mb-2">{TYPE_LABELS[section.type] || section.type} ({section.items.length})</h2>
                    <div className="space-y-1">
                      {section.items.map((item: any) => (
                        <Link key={item.id} href={item.href} className="card-surface p-3 flex justify-between items-center hover:border-electric/30 transition-colors block">
                          <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            {item.subtitle && <p className="text-xs text-silver">{item.subtitle}</p>}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {item.badge && <span className="badge bg-silver/10 text-silver text-[10px]">{item.badge}</span>}
                            <span className={`badge text-[10px] ${TYPE_COLORS[section.type] || 'bg-silver/10 text-silver'}`}>{section.type}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
