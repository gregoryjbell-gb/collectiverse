'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MyLiveActivityPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/live/my-activity')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return null;

  const { reminders, claims, bids, breakSpots, livePurchases, requiredActions } = data;
  const hasActivity = reminders.length > 0 || claims.length > 0 || bids.length > 0 || breakSpots.length > 0 || livePurchases.length > 0;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Live Activity</h1>
          <Link href="/live" className="text-sm text-silver hover:text-electric">Browse Live Events</Link>
        </div>

        {/* Required Actions */}
        {requiredActions.length > 0 && (
          <section className="mb-6">
            <h2 className="font-semibold text-amber-400 mb-3">⚡ Required Actions ({requiredActions.length})</h2>
            <div className="card-surface p-4 space-y-2">
              {requiredActions.map((action: any, i: number) => (
                <Link key={i} href={`/sales/${action.saleId}`} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0 hover:bg-silver/5 rounded px-2 transition-colors">
                  <p className="text-sm">{action.label}</p>
                  <span className="text-electric text-xs">Go →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Reminders */}
        {reminders.length > 0 && (
          <section className="mb-6">
            <h2 className="font-semibold mb-3">🔔 My Reminders ({reminders.length})</h2>
            <div className="space-y-2">
              {reminders.map((r: any) => (
                <Link key={r.id} href={`/live/${r.event?.id}`} className="card-surface p-4 hover:border-electric/30 transition-colors block">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{r.event?.title || 'Event'}</p>
                      <p className="text-xs text-silver">{r.seller} • {r.event?.scheduledStartAt ? new Date(r.event.scheduledStartAt).toLocaleString() : 'TBD'}</p>
                    </div>
                    <span className={`badge text-xs ${r.event?.status === 'LIVE' ? 'bg-red-400/20 text-red-400' : 'bg-blue-400/20 text-blue-400'}`}>{r.event?.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Claims */}
        {claims.length > 0 && (
          <section className="mb-6">
            <h2 className="font-semibold mb-3">🏷️ My Claims ({claims.length})</h2>
            <div className="card-surface p-4 space-y-2">
              {claims.map((c: any) => (
                <div key={c.id} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0">
                  <div><p className="text-sm">${c.claimAmount}</p><p className="text-xs text-silver">{new Date(c.createdAt).toLocaleDateString()}</p></div>
                  <div className="flex items-center gap-2">
                    <span className={`badge text-xs ${c.status === 'CONVERTED_TO_SALE' ? 'bg-green-400/20 text-green-400' : c.status === 'PENDING' ? 'bg-amber-400/20 text-amber-400' : c.status === 'DECLINED' ? 'bg-red-400/20 text-red-400' : 'bg-silver/20 text-silver'}`}>{c.status.replace(/_/g, ' ')}</span>
                    {c.saleId && <Link href={`/sales/${c.saleId}`} className="text-electric text-xs">Sale →</Link>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bids */}
        {bids.length > 0 && (
          <section className="mb-6">
            <h2 className="font-semibold mb-3">💰 My Bids ({bids.length})</h2>
            <div className="card-surface p-4 space-y-2">
              {bids.map((b: any) => (
                <div key={b.id} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0">
                  <div><p className="text-sm font-bold">${b.amount}</p><p className="text-xs text-silver">{new Date(b.createdAt).toLocaleDateString()}</p></div>
                  <span className={`badge text-xs ${b.status === 'WINNING' ? 'bg-green-400/20 text-green-400' : b.status === 'WON' ? 'bg-electric/20 text-electric' : b.status === 'OUTBID' ? 'bg-red-400/20 text-red-400' : 'bg-silver/20 text-silver'}`}>{b.status}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Break Spots */}
        {breakSpots.length > 0 && (
          <section className="mb-6">
            <h2 className="font-semibold mb-3">🎟️ My Break Spots ({breakSpots.length})</h2>
            <div className="space-y-2">
              {breakSpots.map((s: any) => (
                <div key={s.id} className="card-surface p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{s.liveBreak?.title || 'Break'} — Spot #{s.spotNumber}</p>
                    <p className="text-xs text-silver">
                      {s.assignedTeam && `Team: ${s.assignedTeam}`}
                      {s.assignedDivision && `Division: ${s.assignedDivision}`}
                      {s.assignedPackNumber && `Pack: #${s.assignedPackNumber}`}
                      {!s.assignedTeam && !s.assignedDivision && !s.assignedPackNumber && 'Awaiting assignment'}
                    </p>
                  </div>
                  <span className={`badge text-xs ${s.status === 'ASSIGNED' ? 'bg-green-400/20 text-green-400' : 'bg-silver/20 text-silver'}`}>{s.status}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Live Purchases */}
        {livePurchases.length > 0 && (
          <section className="mb-6">
            <h2 className="font-semibold mb-3">🛒 Live Purchases ({livePurchases.length})</h2>
            <div className="space-y-2">
              {livePurchases.map((sale: any) => (
                <Link key={sale.id} href={`/sales/${sale.id}`} className="card-surface p-4 hover:border-electric/30 transition-colors block">
                  <div className="flex justify-between items-center">
                    <div><p className="text-sm">Sale #{sale.id.slice(-8)} — ${sale.totalAmount || sale.salePrice || 0}</p><p className="text-xs text-silver">{new Date(sale.updatedAt).toLocaleDateString()}</p></div>
                    <span className={`badge text-xs ${sale.status === 'COMPLETED' ? 'bg-green-400/20 text-green-400' : sale.status === 'PAYMENT_PENDING' ? 'bg-amber-400/20 text-amber-400' : 'bg-silver/20 text-silver'}`}>{sale.status.replace(/_/g, ' ')}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!hasActivity && (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Live Activity Yet</h2>
            <p className="text-silver text-sm mb-4">Join a live event, claim items, place bids, or buy break spots to see your activity here.</p>
            <Link href="/live" className="btn-primary text-sm">Browse Live Events</Link>
          </div>
        )}
      </div>
    </main>
  );
}
