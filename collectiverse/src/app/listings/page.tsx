'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/listings')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setListings(d.listings || []); })
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    await fetch(`/api/listings/${id}`, { method: 'DELETE' });
    setListings(listings.filter(l => l.id !== id));
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/listings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    setListings(listings.map(l => l.id === id ? { ...l, status } : l));
  };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Listings</h1>
          <Link href="/listings/add" className="btn-primary text-sm">+ Create Listing</Link>
        </div>

        {loading ? <div className="text-silver text-center py-12">Loading...</div> : listings.length === 0 ? (
          <div className="card-surface p-12 text-center">
            <p className="text-silver text-lg mb-4">No listings yet</p>
            <p className="text-silver text-sm">Create a listing from your inventory or groups.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-silver/20 text-left text-silver text-xs">
                <th className="py-2 px-2">Type</th><th className="py-2 px-2">Price</th><th className="py-2 px-2">Offers</th><th className="py-2 px-2">Trades</th><th className="py-2 px-2">Status</th><th className="py-2 px-2">Created</th><th className="py-2 px-2">Actions</th>
              </tr></thead>
              <tbody>
                {listings.map((l: any) => (
                  <tr key={l.id} className="border-b border-silver/10 hover:bg-silver/5">
                    <td className="py-2 px-2"><span className="badge bg-electric/20 text-electric text-xs">{l.listingType}</span></td>
                    <td className="py-2 px-2 text-electric font-medium">{l.price ? `$${l.price}` : '—'}</td>
                    <td className="py-2 px-2 text-silver">{l.allowOffers ? '✓' : '—'}</td>
                    <td className="py-2 px-2 text-silver">{l.allowTrades ? '✓' : '—'}</td>
                    <td className="py-2 px-2"><span className={`badge text-xs ${l.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : l.status === 'SOLD' ? 'bg-amber-500/20 text-amber-400' : l.status === 'PAUSED' ? 'bg-silver/20 text-silver' : 'bg-silver/10 text-silver'}`}>{l.status}</span></td>
                    <td className="py-2 px-2 text-silver text-xs">{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 px-2">
                      <div className="flex gap-2">
                        {l.status === 'DRAFT' && <button onClick={() => updateStatus(l.id, 'ACTIVE')} className="text-green-400 text-xs hover:underline">Activate</button>}
                        {l.status === 'ACTIVE' && <button onClick={() => updateStatus(l.id, 'PAUSED')} className="text-silver text-xs hover:underline">Pause</button>}
                        {l.status === 'PAUSED' && <button onClick={() => updateStatus(l.id, 'ACTIVE')} className="text-green-400 text-xs hover:underline">Resume</button>}
                        {(l.status === 'ACTIVE' || l.status === 'PAUSED') && <button onClick={() => updateStatus(l.id, 'SOLD')} className="text-amber-400 text-xs hover:underline">Sold</button>}
                        <button onClick={() => handleDelete(l.id)} className="text-red-400 text-xs hover:underline">Del</button>
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
