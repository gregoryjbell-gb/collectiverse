'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LiveStudioPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/live/studio')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return null;

  const { events, pendingClaims, activeAuctions, activeBreaks, salesNeedingAction } = data;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Live Studio</h1>
          <Link href="/live/create" className="btn-primary text-sm">+ Create Event</Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="card-surface p-4 text-center"><p className="text-xl font-bold text-red-400">{events.live.length}</p><p className="text-xs text-silver">Live Now</p></div>
          <div className="card-surface p-4 text-center"><p className="text-xl font-bold text-blue-400">{events.scheduled.length}</p><p className="text-xs text-silver">Scheduled</p></div>
          <div className="card-surface p-4 text-center"><p className="text-xl font-bold text-amber-400">{pendingClaims.length}</p><p className="text-xs text-silver">Pending Claims</p></div>
          <div className="card-surface p-4 text-center"><p className="text-xl font-bold text-purple-400">{activeAuctions.length}</p><p className="text-xs text-silver">Active Auctions</p></div>
          <div className="card-surface p-4 text-center"><p className="text-xl font-bold text-green-400">{activeBreaks.length}</p><p className="text-xs text-silver">Active Breaks</p></div>
        </div>

        {/* Live Events */}
        {events.live.length > 0 && (
          <section className="mb-6">
            <h2 className="font-semibold text-red-400 mb-3">🔴 Live Now</h2>
            <div className="space-y-2">
              {events.live.map((e: any) => (
                <Link key={e.id} href={`/live/${e.id}/manage`} className="card-surface p-4 hover:border-electric/30 transition-colors block border-red-400/20 border">
                  <div className="flex justify-between items-center">
                    <div><p className="font-medium text-sm">{e.title}</p><p className="text-xs text-silver">{e._count?.items || 0} items • {e._count?.claims || 0} claims</p></div>
                    <span className="btn-primary text-xs">Manage →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Pending Claims */}
        {pendingClaims.length > 0 && (
          <section className="mb-6">
            <h2 className="font-semibold text-amber-400 mb-3">🏷️ Pending Claims ({pendingClaims.length})</h2>
            <div className="card-surface p-4 space-y-2">
              {pendingClaims.map((claim: any) => (
                <div key={claim.id} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0">
                  <div><p className="text-sm">${claim.claimAmount} claim</p><p className="text-xs text-silver">Buyer: {claim.buyerUserId.slice(-8)}</p></div>
                  <div className="flex gap-2">
                    <button onClick={async () => { await fetch(`/api/live-claims/${claim.id}/accept`, { method: 'POST' }); router.refresh(); }} className="px-3 py-1 rounded text-xs bg-green-400/10 text-green-400 hover:bg-green-400/20">Accept</button>
                    <button onClick={async () => { await fetch(`/api/live-claims/${claim.id}/decline`, { method: 'POST' }); router.refresh(); }} className="px-3 py-1 rounded text-xs bg-red-400/10 text-red-400 hover:bg-red-400/20">Decline</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active Breaks */}
        {activeBreaks.length > 0 && (
          <section className="mb-6">
            <h2 className="font-semibold text-green-400 mb-3">📦 Active Breaks</h2>
            <div className="space-y-2">
              {activeBreaks.map((b: any) => (
                <div key={b.id} className="card-surface p-4 flex justify-between items-center">
                  <div><p className="text-sm font-medium">{b.title}</p><p className="text-xs text-silver">{b.filledSpots}/{b.totalSpots} spots • {b.status}</p></div>
                  <span className={`badge text-xs ${b.status === 'BREAKING' ? 'bg-red-400/20 text-red-400' : b.status === 'SOLD_OUT' ? 'bg-green-400/20 text-green-400' : 'bg-silver/20 text-silver'}`}>{b.status}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sales Needing Action */}
        {salesNeedingAction.length > 0 && (
          <section className="mb-6">
            <h2 className="font-semibold mb-3">📋 Fulfillment ({salesNeedingAction.length})</h2>
            <div className="space-y-2">
              {salesNeedingAction.map((sale: any) => (
                <Link key={sale.id} href={`/sales/${sale.id}`} className="card-surface p-4 hover:border-electric/30 transition-colors block">
                  <div className="flex justify-between items-center">
                    <div><p className="text-sm">Sale #{sale.id.slice(-8)}</p><p className="text-xs text-silver">${sale.totalAmount || sale.salePrice || 0}</p></div>
                    <span className={`badge text-xs ${sale.status === 'READY_TO_SHIP' ? 'bg-blue-400/20 text-blue-400' : 'bg-amber-400/20 text-amber-400'}`}>{sale.status.replace(/_/g, ' ')}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Scheduled Events */}
        {events.scheduled.length > 0 && (
          <section className="mb-6">
            <h2 className="font-semibold mb-3">📅 Scheduled</h2>
            <div className="space-y-2">
              {events.scheduled.map((e: any) => (
                <Link key={e.id} href={`/live/${e.id}/manage`} className="card-surface p-4 hover:border-electric/30 transition-colors block">
                  <div className="flex justify-between items-center">
                    <div><p className="text-sm font-medium">{e.title}</p>{e.scheduledStartAt && <p className="text-xs text-electric">{new Date(e.scheduledStartAt).toLocaleString()}</p>}</div>
                    <span className="text-xs text-silver">Manage →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {events.total === 0 && pendingClaims.length === 0 && (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">Welcome to Live Studio</h2>
            <p className="text-silver text-sm mb-4">Create your first live event to start selling cards, running breaks, or hosting auctions.</p>
            <Link href="/live/create" className="btn-primary text-sm">Create Live Event</Link>
          </div>
        )}
      </div>
    </main>
  );
}
