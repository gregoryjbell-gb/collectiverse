'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function InventoryPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen py-12 px-6 text-silver text-center">Loading...</div>}>
      <InventoryPage />
    </Suspense>
  );
}

function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Read from URL
  const q = searchParams.get('q') || '';
  const sport = searchParams.get('sport') || '';
  const year = searchParams.get('year') || '';
  const status = searchParams.get('status') || '';
  const condition = searchParams.get('condition') || '';
  const gradeCompany = searchParams.get('gradeCompany') || '';
  const storageLocation = searchParams.get('storageLocation') || '';
  const minValue = searchParams.get('minValue') || '';
  const maxValue = searchParams.get('maxValue') || '';
  const sort = searchParams.get('sort') || 'createdAt';
  const order = searchParams.get('order') || 'desc';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '25');

  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (sport) params.set('sport', sport);
    if (year) params.set('year', year);
    if (status) params.set('status', status);
    if (condition) params.set('condition', condition);
    if (gradeCompany) params.set('gradeCompany', gradeCompany);
    if (storageLocation) params.set('storageLocation', storageLocation);
    if (minValue) params.set('minValue', minValue);
    if (maxValue) params.set('maxValue', maxValue);
    params.set('sort', sort);
    params.set('order', order);
    params.set('page', String(page));
    params.set('limit', String(pageSize));

    fetch(`/api/inventory?${params}`)
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) { setItems(d.items || []); setTotal(d.pagination?.total || 0); setTotalPages(d.pagination?.totalPages || 1); } })
      .finally(() => setLoading(false));
  }, [q, sport, year, status, condition, gradeCompany, storageLocation, minValue, maxValue, sort, order, page, pageSize]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v); else params.delete(k);
    }
    if (!updates.page) params.set('page', '1');
    router.push(`/inventory?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); updateParams({ q: searchInput }); };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove from inventory?')) return;
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
    setItems(items.filter(i => i.id !== id));
    setTotal(t => t - 1);
  };

  const totalValue = items.reduce((s, i) => s + (i.estimatedValue || 0) * i.quantity, 0);
  const totalInvested = items.reduce((s, i) => s + (i.purchasePrice || 0) * i.quantity, 0);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Inventory</h1>
            <p className="text-silver text-sm">{total} items • ${totalValue.toLocaleString()} value • ${totalInvested.toLocaleString()} invested</p>
          </div>
          <div className="flex gap-3">
            <Link href="/inventory/add" className="btn-primary text-sm">+ Add Card</Link>
            <Link href="/dashboard" className="btn-secondary text-sm">Dashboard</Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="card-surface p-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-3 mb-3 flex-wrap">
            <input type="search" className="input-field flex-1 min-w-[200px]" placeholder="Search player, set, team, card #, notes, location, cert..." value={searchInput} onChange={e => setSearchInput(e.target.value)} />
            <button type="submit" className="btn-primary text-sm">Search</button>
          </form>
          <div className="flex flex-wrap gap-2">
            <select className="input-field w-auto text-sm" value={sport} onChange={e => updateParams({ sport: e.target.value })}>
              <option value="">All Sports</option>
              <option value="NFL">NFL</option>
              <option value="NBA">NBA</option>
              <option value="MLB">MLB</option>
            </select>
            <select className="input-field w-auto text-sm" value={status} onChange={e => updateParams({ status: e.target.value })}>
              <option value="">All Statuses</option>
              <option value="OWNED">Owned</option>
              <option value="FOR_SALE">For Sale</option>
              <option value="SOLD">Sold</option>
              <option value="TRADE_ONLY">Trade Only</option>
              <option value="WATCHLIST">Watchlist</option>
            </select>
            <select className="input-field w-auto text-sm" value={condition} onChange={e => updateParams({ condition: e.target.value })}>
              <option value="">All Conditions</option>
              <option value="RAW">Raw</option>
              <option value="PSA">PSA</option>
              <option value="BGS">BGS</option>
              <option value="SGC">SGC</option>
              <option value="CGC">CGC</option>
            </select>
            <input type="number" className="input-field w-20 text-sm" placeholder="Year" value={year} onChange={e => updateParams({ year: e.target.value })} />
            <input className="input-field w-28 text-sm" placeholder="Location" value={storageLocation} onChange={e => updateParams({ storageLocation: e.target.value })} />
            <select className="input-field w-auto text-sm" value={`${sort}_${order}`} onChange={e => { const [s, o] = e.target.value.split('_'); updateParams({ sort: s, order: o }); }}>
              <option value="createdAt_desc">Newest</option>
              <option value="createdAt_asc">Oldest</option>
              <option value="estimatedValue_desc">Value High-Low</option>
              <option value="estimatedValue_asc">Value Low-High</option>
              <option value="purchasePrice_desc">Cost High-Low</option>
              <option value="purchasePrice_asc">Cost Low-High</option>
            </select>
            {(q || sport || year || status || condition || gradeCompany || storageLocation || minValue || maxValue) && (
              <button onClick={() => { setSearchInput(''); router.push('/inventory'); }} className="text-xs text-red-400 hover:underline">Clear All</button>
            )}
          </div>
        </div>

        {/* Results info */}
        <div className="flex justify-between items-center mb-3">
          <p className="text-silver text-sm">{total} items</p>
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
            <p className="text-silver text-lg mb-4">No items found</p>
            <Link href="/inventory/add" className="btn-primary">Add Your First Card</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silver/20 text-left text-silver text-xs">
                  <th className="py-2 px-2">Year</th>
                  <th className="py-2 px-2">Player</th>
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Set</th>
                  <th className="py-2 px-2">Mfr</th>
                  <th className="py-2 px-2">Grade</th>
                  <th className="py-2 px-2">Qty</th>
                  <th className="py-2 px-2">Cost</th>
                  <th className="py-2 px-2">Value</th>
                  <th className="py-2 px-2">G/L</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2">Location</th>
                  <th className="py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const gl = (item.estimatedValue || 0) - (item.purchasePrice || 0);
                  return (
                    <tr key={item.id} className="border-b border-silver/10 hover:bg-silver/5 transition-colors">
                      <td className="py-2 px-2 text-silver">{item.card?.set?.year || item.card?.year || '—'}</td>
                      <td className="py-2 px-2 font-medium">{item.card?.person?.displayName || '—'}</td>
                      <td className="py-2 px-2 text-silver">{item.card?.cardNumber || '—'}</td>
                      <td className="py-2 px-2 text-silver text-xs">{item.card?.set?.name || '—'}</td>
                      <td className="py-2 px-2 text-silver text-xs">{item.card?.set?.manufacturer || '—'}</td>
                      <td className="py-2 px-2">
                        {!item.condition || item.condition === 'RAW' ? (
                          <span className="text-silver text-xs">Raw</span>
                        ) : (
                          <span className="text-electric text-xs font-medium">{item.condition} {item.gradeValue}</span>
                        )}
                      </td>
                      <td className="py-2 px-2">{item.quantity}</td>
                      <td className="py-2 px-2 text-silver">{item.purchasePrice ? `$${item.purchasePrice}` : '—'}</td>
                      <td className="py-2 px-2 text-electric font-medium">{item.estimatedValue ? `$${item.estimatedValue}` : '—'}</td>
                      <td className="py-2 px-2">
                        {item.purchasePrice && item.estimatedValue ? (
                          <span className={`text-xs font-medium ${gl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{gl >= 0 ? '+' : ''}${gl}</span>
                        ) : '—'}
                      </td>
                      <td className="py-2 px-2">
                        <span className={`badge text-[10px] ${item.status === 'FOR_SALE' ? 'bg-green-500/20 text-green-400' : item.status === 'SOLD' ? 'bg-red-500/20 text-red-400' : item.status === 'WATCHLIST' ? 'bg-purple-500/20 text-purple-400' : 'bg-silver/10 text-silver'}`}>{item.status}</span>
                      </td>
                      <td className="py-2 px-2 text-silver text-xs">{item.storageLocation || '—'}</td>
                      <td className="py-2 px-2">
                        <div className="flex gap-1.5">
                          <Link href={`/inventory/${item.id}`} className="text-electric text-xs hover:underline">View</Link>
                          <Link href={`/inventory/${item.id}/edit`} className="text-silver text-xs hover:underline">Edit</Link>
                          <button onClick={() => handleDelete(item.id)} className="text-red-400 text-xs hover:underline">Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
