'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ManageLiveEventPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState({ title: '', claimPrice: '', description: '' });

  const load = () => {
    fetch(`/api/live-events/${id}`)
      .then(r => { if (!r.ok) { router.push('/live'); return null; } return r.json(); })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleStart = async () => { await fetch(`/api/live-events/${id}/start`, { method: 'POST' }); load(); };
  const handleEnd = async () => { await fetch(`/api/live-events/${id}/end`, { method: 'POST' }); load(); };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/live-events/${id}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addForm) });
    setAddForm({ title: '', claimPrice: '', description: '' });
    load();
  };

  const handlePresent = async (itemId: string) => {
    // Set all items to QUEUED first, then set this one to PRESENTING
    if (data?.event?.items) {
      for (const item of data.event.items) {
        if (item.status === 'PRESENTING') {
          await fetch(`/api/live-events/${id}/items/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'QUEUED' }) });
        }
      }
    }
    await fetch(`/api/live-events/${id}/items/${itemId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PRESENTING' }) });
    load();
  };

  const handleAcceptClaim = async (claimId: string) => {
    await fetch(`/api/live-claims/${claimId}/accept`, { method: 'POST' });
    load();
  };

  const handleDeclineClaim = async (claimId: string) => {
    await fetch(`/api/live-claims/${claimId}/decline`, { method: 'POST' });
    load();
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return null;

  const { event } = data;
  const pendingClaims = event.claims?.filter((c: any) => c.status === 'PENDING') || [];

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage: {event.title}</h1>
          <Link href={`/live/${id}`} className="text-sm text-silver hover:text-electric">View Public Page</Link>
        </div>

        {/* Controls */}
        <div className="card-surface p-4 mb-6 flex gap-3 flex-wrap">
          {event.status === 'SCHEDULED' && <button onClick={handleStart} className="btn-primary text-sm">Go Live</button>}
          {event.status === 'LIVE' && <button onClick={handleEnd} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-400/10 text-red-400 hover:bg-red-400/20">End Event</button>}
          <span className={`badge text-xs ${event.status === 'LIVE' ? 'bg-red-400/20 text-red-400' : 'bg-silver/20 text-silver'}`}>{event.status}</span>
        </div>

        {/* Pending Claims */}
        {pendingClaims.length > 0 && (
          <div className="card-surface p-5 mb-6 border-amber-400/30 border">
            <h3 className="font-semibold text-sm text-amber-400 mb-3">Pending Claims ({pendingClaims.length})</h3>
            {pendingClaims.map((claim: any) => (
              <div key={claim.id} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0">
                <div>
                  <p className="text-sm">${claim.claimAmount} claim</p>
                  <p className="text-xs text-silver">Buyer: {claim.buyerUserId.slice(-8)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAcceptClaim(claim.id)} className="px-3 py-1 rounded text-xs bg-green-400/10 text-green-400 hover:bg-green-400/20">Accept</button>
                  <button onClick={() => handleDeclineClaim(claim.id)} className="px-3 py-1 rounded text-xs bg-red-400/10 text-red-400 hover:bg-red-400/20">Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Item */}
        <form onSubmit={handleAddItem} className="card-surface p-4 mb-6 flex gap-3 flex-wrap">
          <input className="input-field text-sm flex-1" placeholder="Item title" value={addForm.title} onChange={e => setAddForm({...addForm, title: e.target.value})} required />
          <input type="number" step="0.01" className="input-field text-sm w-28" placeholder="Price" value={addForm.claimPrice} onChange={e => setAddForm({...addForm, claimPrice: e.target.value})} />
          <button type="submit" className="btn-secondary text-sm">Add Item</button>
        </form>

        {/* Items Queue */}
        <div className="card-surface p-5">
          <h3 className="font-semibold text-sm mb-3">Items ({event.items?.length || 0})</h3>
          <div className="space-y-2">
            {event.items?.map((item: any) => (
              <div key={item.id} className={`flex justify-between items-center p-3 rounded-lg ${item.status === 'PRESENTING' ? 'bg-electric/10 border border-electric/30' : 'bg-gunmetal/30'}`}>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-silver">{item.claimPrice ? `$${item.claimPrice}` : 'No price'} • {item.status}</p>
                </div>
                <div className="flex gap-2">
                  {item.status === 'QUEUED' && <button onClick={() => handlePresent(item.id)} className="text-electric text-xs hover:underline">Present</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
