'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface InventoryItemData {
  id: string;
  quantity: number;
  condition: string | null;
  gradeCompany: string | null;
  gradeValue: string | null;
  estimatedValue: number | null;
  purchasePrice: number | null;
  status: string;
  storageLocation: string | null;
  card: {
    id: string;
    cardNumber: string | null;
    year: number | null;
    frontImageUrl: string | null;
    person: { id: string; displayName: string } | null;
    team: { id: string; name: string } | null;
    set: { id: string; name: string; year: number; manufacturer: string | null } | null;
  };
}

const STATUS_OPTIONS = ['OWNED', 'FOR_SALE', 'SOLD', 'TRADE_ONLY', 'WATCHLIST'];
const CONDITION_OPTIONS = ['RAW', 'PSA', 'BGS', 'SGC', 'CGC'];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const router = useRouter();

  const loadItems = () => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (statusFilter) params.set('status', statusFilter);
    if (conditionFilter) params.set('condition', conditionFilter);

    fetch(`/api/inventory?${params}`)
      .then((r) => {
        if (r.status === 401) { router.push('/login'); return null; }
        return r.json();
      })
      .then((d) => { if (d) setItems(d.items || []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadItems(); }, [search, statusFilter, conditionFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this item from your inventory?')) return;
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
    setItems(items.filter((i) => i.id !== id));
  };

  const totalValue = items.reduce((sum, i) => sum + (i.estimatedValue || 0) * i.quantity, 0);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Inventory</h1>
            <p className="text-silver text-sm">{items.length} items • ${totalValue.toLocaleString()} estimated value</p>
          </div>
          <Link href="/cards" className="btn-primary">+ Add from Card Database</Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="search"
            placeholder="Search player, set, card #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field max-w-xs"
            aria-label="Search inventory"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-auto" aria-label="Filter by status">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)} className="input-field w-auto" aria-label="Filter by condition">
            <option value="">All Conditions</option>
            {CONDITION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {(search || statusFilter || conditionFilter) && (
            <button onClick={() => { setSearch(''); setStatusFilter(''); setConditionFilter(''); }} className="text-sm text-red-400 hover:underline">Clear</button>
          )}
        </div>

        {loading ? (
          <div className="text-silver text-center py-12">Loading...</div>
        ) : items.length === 0 ? (
          <div className="card-surface p-12 text-center">
            <p className="text-silver text-lg mb-4">Your inventory is empty</p>
            <Link href="/cards" className="btn-primary">Browse Cards to Add</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silver/20 text-left text-silver">
                  <th className="py-3 px-2">Player</th>
                  <th className="py-3 px-2">Set</th>
                  <th className="py-3 px-2">#</th>
                  <th className="py-3 px-2">Year</th>
                  <th className="py-3 px-2">Grade</th>
                  <th className="py-3 px-2">Qty</th>
                  <th className="py-3 px-2">Value</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Location</th>
                  <th className="py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-silver/10 hover:bg-silver/5 transition-colors">
                    <td className="py-3 px-2 font-medium">{item.card.person?.displayName || 'Unknown'}</td>
                    <td className="py-3 px-2 text-silver">{item.card.set?.name}</td>
                    <td className="py-3 px-2 text-silver">{item.card.cardNumber}</td>
                    <td className="py-3 px-2 text-silver">{item.card.year}</td>
                    <td className="py-3 px-2">
                      {item.condition === 'RAW' || !item.condition ? (
                        <span className="badge bg-silver/10 text-silver">Raw</span>
                      ) : (
                        <span className="badge bg-electric/20 text-electric">{item.condition} {item.gradeValue}</span>
                      )}
                    </td>
                    <td className="py-3 px-2">{item.quantity}</td>
                    <td className="py-3 px-2 text-electric font-medium">{item.estimatedValue ? `$${item.estimatedValue.toLocaleString()}` : '—'}</td>
                    <td className="py-3 px-2">
                      <span className={`badge text-xs ${item.status === 'FOR_SALE' ? 'bg-green-500/20 text-green-400' : item.status === 'SOLD' ? 'bg-red-500/20 text-red-400' : 'bg-silver/10 text-silver'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-silver text-xs">{item.storageLocation || '—'}</td>
                    <td className="py-3 px-2">
                      <div className="flex gap-2">
                        <Link href={`/inventory/${item.id}`} className="text-electric text-xs hover:underline">View</Link>
                        <Link href={`/inventory/${item.id}/edit`} className="text-silver text-xs hover:underline">Edit</Link>
                        <button onClick={() => handleDelete(item.id)} className="text-red-400 text-xs hover:underline">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
