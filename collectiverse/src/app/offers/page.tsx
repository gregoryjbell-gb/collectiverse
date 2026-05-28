'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OffersPage() {
  const [sent, setSent] = useState<any[]>([]);
  const [received, setReceived] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/offers')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) { setSent(d.sent || []); setReceived(d.received || []); } })
      .finally(() => setLoading(false));
  }, [router]);

  const respond = async (id: string, status: string, counterAmount?: string) => {
    const body: any = { status };
    if (counterAmount) body.counterAmount = counterAmount;
    await fetch(`/api/offers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    // Refresh
    const d = await fetch('/api/offers').then(r => r.json());
    setSent(d.sent || []); setReceived(d.received || []);
  };

  const offers = tab === 'received' ? received : sent;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Offers</h1>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('received')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'received' ? 'bg-electric text-white' : 'bg-gunmetal/50 text-silver'}`}>Received ({received.length})</button>
          <button onClick={() => setTab('sent')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'sent' ? 'bg-electric text-white' : 'bg-gunmetal/50 text-silver'}`}>Sent ({sent.length})</button>
        </div>

        {loading ? <div className="text-silver text-center py-12">Loading...</div> : offers.length === 0 ? (
          <div className="card-surface p-12 text-center"><p className="text-silver">No {tab} offers.</p></div>
        ) : (
          <div className="space-y-3">
            {offers.map((o: any) => (
              <div key={o.id} className="card-surface p-4 flex justify-between items-center">
                <div>
                  <div className="flex gap-2 items-center mb-1">
                    <span className="text-electric font-bold">${o.amount}</span>
                    <span className={`badge text-xs ${o.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : o.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-400' : o.status === 'DECLINED' ? 'bg-red-500/20 text-red-400' : o.status === 'COUNTERED' ? 'bg-purple-500/20 text-purple-400' : 'bg-silver/10 text-silver'}`}>{o.status}</span>
                    {o.counterAmount && <span className="text-xs text-purple-400">Counter: ${o.counterAmount}</span>}
                  </div>
                  {o.message && <p className="text-xs text-silver">{o.message}</p>}
                  <p className="text-[10px] text-silver/60">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
                {tab === 'received' && o.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button onClick={() => respond(o.id, 'ACCEPTED')} className="text-green-400 text-xs hover:underline">Accept</button>
                    <button onClick={() => respond(o.id, 'DECLINED')} className="text-red-400 text-xs hover:underline">Decline</button>
                    <button onClick={() => { const amt = prompt('Counter amount:'); if (amt) respond(o.id, 'COUNTERED', amt); }} className="text-purple-400 text-xs hover:underline">Counter</button>
                  </div>
                )}
                {tab === 'sent' && o.status === 'PENDING' && (
                  <button onClick={() => respond(o.id, 'CANCELLED')} className="text-red-400 text-xs hover:underline">Cancel</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
