'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STATUS_OPTIONS = ['OWNED', 'FOR_SALE', 'SOLD', 'TRADE_ONLY', 'WATCHLIST'];
const CONDITION_OPTIONS = ['RAW', 'PSA', 'BGS', 'SGC', 'CGC'];

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [page, setPage] = useState(1);
  const router = useRouter();

  const loadItems = () => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (statusFilter) params.set('status', statusFilter);
    if (conditionFilter) params.set('condition', conditionFilter);
    if (sportFilter) params.set('sport', sportFilter);
    params.set('page', String(page));
    params.set('limit', '50');

    fetch(`/api/inventory?${params}`)
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) { setItems(d.items || []); setPagination(d.pagination || {}); } })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadItems(); }, [search, statusFilter, conditionFilter, sportFilter, page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this item from your inventory?')) return;
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
    setItems(items.filter(i => i.id !== id));
  };

  const totalValue = items.reduce((sum, i) => sum + (i.estimatedValue || 0) * i.quantity, 0);
  const totalInvested = items.reduce((sum, i) => sum + (i.purchasePrice || 0) * i.quantity, 0);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Inventory</h1>
            <p className="text-silver text-sm">{pagination.total} items • ${totalValue.toLocaleString()} value • ${totalInvested.toLocaleString()} invested</p>
          </div>
          <Link href="/inventory/add" className="btn-primary">+ Add Card</Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input type="search" placeholder="Search player, set, card #, team..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-field max-w-xs" aria-label="Search inventory" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-auto" aria-label="Filter by status">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={conditionFilter} onChange={e => { setConditionFilter(e.target.value); setPage(1); }} className="input-field w-auto" aria-label="Filter by condition">
            <option value="">All Conditions</option>
            {CONDITION_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sportFilter} onChange={e => { setSportFilter(e.target.value); setPage(1); }} className="input-field w-auto" aria-label="Filter by sport">
            <option value="">All Sports</option>
            <option value="NFL">NFL</option>
            <option value="NBA">NBA</option>
            <option value="MLB">MLB</option>
          </select>
          {(search || statusFilter || conditionFilter || sportFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setConditionFilter(''); setSportFilter(''); setPage(1); }} className="text-sm text-red-400 hover:underline">Clear All</button>
          )}
        </div>

        {loading ? (
          <div className="text-silver text-center py-12">Loading...</div>
        ) : items.length === 0 ? (
          <div className="card-surface p-12 text-center">
            <p className="text-silver text-lg mb-4">No items found</p>
            <Link href="/inventory/add" className="btn-primary">Add Your First Card</Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-silver/20 text-left text-silver text-xs">
                    <th className="py-2 px-2">Player</th>
                    <th className="py-2 px-2">Set</th>
                    <th className="py-2 px-2">Mfr</th>
                    <th className="py-2 px-2">Year</th>
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2">Attrs</th>
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
                        <td className="py-2 px-2 font-medium">{item.card.person?.displayName || '—'}</td>
                        <td className="py-2 px-2 text-silver text-xs">{item.card.set?.name || '—'}</td>
                        <td className="py-2 px-2 text-silver text-xs">{item.card.set?.manufacturer || '—'}</td>
                        <td className="py-2 px-2 text-silver">{item.card.set?.year || item.card.year || '—'}</td>
                        <td className="py-2 px-2 text-silver">{item.card.cardNumber || '—'}</td>
                        <td className="py-2 px-2">
                          <div className="flex gap-1">
                            {item.card.rookie && <span className="badge bg-amber-500/20 text-amber-400 text-[10px]">RC</span>}
                            {item.card.parallel && <span className="badge bg-electric/20 text-electric text-[10px]">{item.card.parallel}</span>}
                          </div>
                        </td>
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
                            <span className={`text-xs font-medium ${gl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {gl >= 0 ? '+' : ''}${gl}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-2 px-2">
                          <span className={`badge text-[10px] ${item.status === 'FOR_SALE' ? 'bg-green-500/20 text-green-400' : item.status === 'SOLD' ? 'bg-red-500/20 text-red-400' : item.status === 'WATCHLIST' ? 'bg-purple-500/20 text-purple-400' : 'bg-silver/10 text-silver'}`}>
                            {item.status}
                          </span>
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary text-sm px-3 py-1 disabled:opacity-50">Prev</button>
                <span className="text-silver text-sm py-1">Page {page} of {pagination.totalPages}</span>
                <button onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page === pagination.totalPages} className="btn-secondary text-sm px-3 py-1 disabled:opacity-50">Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
