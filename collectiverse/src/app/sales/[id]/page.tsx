'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-silver/20 text-silver' },
  LISTED: { label: 'Listed', color: 'bg-blue-400/20 text-blue-400' },
  OFFER_RECEIVED: { label: 'Offer Received', color: 'bg-amber-400/20 text-amber-400' },
  OFFER_ACCEPTED: { label: 'Offer Accepted', color: 'bg-green-400/20 text-green-400' },
  PAYMENT_PENDING: { label: 'Payment Pending', color: 'bg-amber-400/20 text-amber-400' },
  PAYMENT_MARKED_PAID: { label: 'Paid', color: 'bg-green-400/20 text-green-400' },
  READY_TO_SHIP: { label: 'Ready to Ship', color: 'bg-blue-400/20 text-blue-400' },
  SHIPPED: { label: 'Shipped', color: 'bg-purple-400/20 text-purple-400' },
  DELIVERED: { label: 'Delivered', color: 'bg-green-400/20 text-green-400' },
  TRANSFER_PENDING: { label: 'Transfer Pending', color: 'bg-amber-400/20 text-amber-400' },
  TRANSFER_COMPLETED: { label: 'Transfer Done', color: 'bg-green-400/20 text-green-400' },
  FEEDBACK_PENDING: { label: 'Feedback Pending', color: 'bg-blue-400/20 text-blue-400' },
  COMPLETED: { label: 'Completed', color: 'bg-green-400/20 text-green-400' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-400/20 text-red-400' },
  DISPUTED: { label: 'Disputed', color: 'bg-red-400/20 text-red-400' },
};

export default function SaleDetailPage() {
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const fetchSale = () => {
    fetch(`/api/sales/${id}`)
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null; }
        if (!r.ok) { router.push('/sales'); return null; }
        return r.json();
      })
      .then(d => { if (d) setSale(d.sale || d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSale(); }, [id]);

  const doAction = async (action: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sales/${id}/${action}`, { method: 'POST' });
      if (res.ok) fetchSale();
      else { const d = await res.json(); alert(d.error || 'Action failed'); }
    } finally { setActionLoading(false); }
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!sale) return null;

  const st = statusLabels[sale.status] || { label: sale.status, color: 'bg-silver/20 text-silver' };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Sale Details</h1>
          <Link href="/sales" className="text-sm text-silver hover:text-electric">All Sales</Link>
        </div>

        <div className="card-surface p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-silver">Sale ID</p>
              <p className="font-mono text-sm">{sale.id}</p>
            </div>
            <span className={`badge text-xs px-3 py-1 rounded-full ${st.color}`}>{st.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {sale.seller && (
              <div>
                <p className="text-xs text-silver">Seller</p>
                <p className="text-sm font-medium">{sale.seller.username || sale.seller.displayName}</p>
              </div>
            )}
            {sale.buyer && (
              <div>
                <p className="text-xs text-silver">Buyer</p>
                <p className="text-sm font-medium">{sale.buyer.username || sale.buyer.displayName}</p>
              </div>
            )}
            {(sale.totalAmount || sale.salePrice) && (
              <div>
                <p className="text-xs text-silver">Amount</p>
                <p className="text-sm font-bold text-electric">${(sale.totalAmount || sale.salePrice)?.toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-silver">Updated</p>
              <p className="text-sm">{new Date(sale.updatedAt).toLocaleString()}</p>
            </div>
          </div>

          {sale.items && sale.items.length > 0 && (
            <div className="border-t border-silver/10 pt-4 mt-4">
              <p className="text-xs text-silver mb-2">Items ({sale.items.length})</p>
              <div className="space-y-2">
                {sale.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-silver/5 last:border-0">
                    <span>{item.inventoryItem?.card?.person?.displayName || item.description || `Item ${i + 1}`}</span>
                    {item.price && <span className="text-electric">${item.price.toLocaleString()}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card-surface p-4">
          <p className="text-xs text-silver mb-3">Actions</p>
          <div className="flex flex-wrap gap-2">
            {sale.status === 'OFFER_RECEIVED' && (
              <button onClick={() => doAction('accept-offer')} disabled={actionLoading} className="btn-primary text-sm">Accept Offer</button>
            )}
            {sale.status === 'PAYMENT_PENDING' && (
              <button onClick={() => doAction('mark-paid')} disabled={actionLoading} className="btn-primary text-sm">Mark as Paid</button>
            )}
            {(sale.status === 'PAYMENT_MARKED_PAID' || sale.status === 'READY_TO_SHIP') && (
              <button onClick={() => doAction('create-shipment')} disabled={actionLoading} className="btn-primary text-sm">Create Shipment</button>
            )}
            {sale.status === 'SHIPPED' && (
              <button onClick={() => doAction('confirm-delivery')} disabled={actionLoading} className="btn-primary text-sm">Confirm Delivery</button>
            )}
            {sale.status === 'DELIVERED' && (
              <button onClick={() => doAction('initiate-transfer')} disabled={actionLoading} className="btn-primary text-sm">Initiate Transfer</button>
            )}
            {sale.status === 'TRANSFER_PENDING' && (
              <button onClick={() => doAction('complete-transfer')} disabled={actionLoading} className="btn-primary text-sm">Complete Transfer</button>
            )}
            {!['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(sale.status) && (
              <>
                <button onClick={() => doAction('cancel')} disabled={actionLoading} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors">Cancel</button>
                <button onClick={() => doAction('dispute')} disabled={actionLoading} className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors">Dispute</button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
