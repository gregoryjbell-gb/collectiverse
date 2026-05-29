'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LiveRecapPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/live-events/${id}/recap`)
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return null;

  const { recap, event, isSeller, fulfillment, myClaims, myBids, myBreakSpots, mySales, requiredActions } = data;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Event Recap: {event?.title}</h1>
          <Link href={`/live/${id}`} className="text-sm text-silver hover:text-electric">← Event Page</Link>
        </div>

        {/* Recap Stats */}
        {recap && (
          <div className="card-surface p-6 mb-6">
            <h2 className="font-semibold mb-4">Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center"><p className="text-xl font-bold text-electric">{recap.totalItemsSold}</p><p className="text-xs text-silver">Items Sold</p></div>
              <div className="text-center"><p className="text-xl font-bold">{recap.totalItemsPresented}</p><p className="text-xs text-silver">Presented</p></div>
              <div className="text-center"><p className="text-xl font-bold text-green-400">${(recap.grossSales || 0).toLocaleString()}</p><p className="text-xs text-silver">Gross Sales</p></div>
              <div className="text-center"><p className="text-xl font-bold text-amber-400">{recap.totalClaims}</p><p className="text-xs text-silver">Claims</p></div>
            </div>
            {recap.totalBids > 0 && <p className="text-xs text-silver mt-3 text-center">{recap.totalBids} bids • {recap.totalAcceptedClaims} accepted claims{recap.totalBreakSpotsSold ? ` • ${recap.totalBreakSpotsSold} break spots sold` : ''}</p>}
          </div>
        )}

        {/* Seller Fulfillment */}
        {isSeller && fulfillment && (
          <div className="card-surface p-5 mb-6">
            <h3 className="font-semibold text-sm mb-3">Fulfillment Checklist</h3>
            <div className="space-y-2">
              {fulfillment.pendingPayments > 0 && <Link href="/sales?status=PAYMENT_PENDING" className="flex justify-between items-center py-2 border-b border-silver/10 hover:bg-silver/5 rounded px-2"><span className="text-sm">Awaiting payment</span><span className="badge bg-amber-400/20 text-amber-400 text-xs">{fulfillment.pendingPayments}</span></Link>}
              {fulfillment.readyToShip > 0 && <Link href="/sales?status=READY_TO_SHIP" className="flex justify-between items-center py-2 border-b border-silver/10 hover:bg-silver/5 rounded px-2"><span className="text-sm">Ready to ship</span><span className="badge bg-blue-400/20 text-blue-400 text-xs">{fulfillment.readyToShip}</span></Link>}
              {fulfillment.transfersPending > 0 && <Link href="/sales?status=TRANSFER_PENDING" className="flex justify-between items-center py-2 hover:bg-silver/5 rounded px-2"><span className="text-sm">Transfers pending</span><span className="badge bg-purple-400/20 text-purple-400 text-xs">{fulfillment.transfersPending}</span></Link>}
              {!fulfillment.pendingPayments && !fulfillment.readyToShip && !fulfillment.transfersPending && <p className="text-green-400 text-sm">All caught up!</p>}
            </div>
          </div>
        )}

        {/* Buyer: Required Actions */}
        {!isSeller && requiredActions?.length > 0 && (
          <div className="card-surface p-5 mb-6 border-amber-400/20 border">
            <h3 className="font-semibold text-sm text-amber-400 mb-3">Your Next Steps</h3>
            {requiredActions.map((a: any, i: number) => (
              <Link key={i} href={`/sales/${a.saleId}`} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0 hover:bg-silver/5 rounded px-2">
                <span className="text-sm">{a.type === 'PAYMENT' ? 'Complete payment' : a.type === 'CONFIRM_DELIVERY' ? 'Confirm delivery' : 'Accept transfer'}</span>
                <span className="text-electric text-xs">Go →</span>
              </Link>
            ))}
          </div>
        )}

        {/* Buyer: My Claims */}
        {!isSeller && myClaims?.length > 0 && (
          <div className="card-surface p-5 mb-6">
            <h3 className="font-semibold text-sm mb-3">My Claims ({myClaims.length})</h3>
            {myClaims.map((c: any) => (
              <div key={c.id} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0">
                <span className="text-sm">${c.claimAmount}</span>
                <span className={`badge text-xs ${c.status === 'CONVERTED_TO_SALE' ? 'bg-green-400/20 text-green-400' : 'bg-silver/20 text-silver'}`}>{c.status.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Buyer: My Bids */}
        {!isSeller && myBids?.length > 0 && (
          <div className="card-surface p-5 mb-6">
            <h3 className="font-semibold text-sm mb-3">My Bids ({myBids.length})</h3>
            {myBids.map((b: any) => (
              <div key={b.id} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0">
                <span className="text-sm font-bold">${b.amount}</span>
                <span className={`badge text-xs ${b.status === 'WON' ? 'bg-green-400/20 text-green-400' : b.status === 'WINNING' ? 'bg-electric/20 text-electric' : 'bg-silver/20 text-silver'}`}>{b.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* Buyer: Break Spots */}
        {!isSeller && myBreakSpots?.length > 0 && (
          <div className="card-surface p-5 mb-6">
            <h3 className="font-semibold text-sm mb-3">My Break Spots ({myBreakSpots.length})</h3>
            {myBreakSpots.map((s: any) => (
              <div key={s.id} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0">
                <div><p className="text-sm">{s.liveBreak?.title} — Spot #{s.spotNumber}</p><p className="text-xs text-silver">{s.assignedTeam || s.assignedDivision || (s.assignedPackNumber ? `Pack #${s.assignedPackNumber}` : 'Pending')}</p></div>
                <span className={`badge text-xs ${s.status === 'ASSIGNED' ? 'bg-green-400/20 text-green-400' : 'bg-silver/20 text-silver'}`}>{s.status}</span>
              </div>
            ))}
          </div>
        )}

        {!recap && <div className="card-surface p-8 text-center"><p className="text-silver">Recap not yet generated. The event may still be in progress.</p></div>}
      </div>
    </main>
  );
}
