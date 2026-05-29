'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'seller' | 'buyer'>('all');
  const router = useRouter();

  useEffect(() => {
    const params = filter === 'all' ? '' : `?role=${filter}`;
    fetch(`/api/sales${params}`)
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setSales(d.sales || []); })
      .finally(() => setLoading(false));
  }, [router, filter]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Sales</h1>
          <Link href="/dashboard" className="text-sm text-silver hover:text-electric">← Dashboard</Link>
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'seller', 'buyer'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${filter === f ? 'bg-electric text-white' : 'bg-gunmetal/50 text-silver hover:text-white'}`}
            >
              {f === 'all' ? 'All Sales' : f === 'seller' ? 'Selling' : 'Buying'}
            </button>
          ))}
        </div>

        {sales.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Sales Yet</h2>
            <p className="text-silver text-sm mb-4">Sales are created when you list items for sale and buyers make offers.</p>
            <Link href="/listings" className="btn-primary text-sm">View Listings</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sales.map((sale: any) => {
              const st = statusLabels[sale.status] || { label: sale.status, color: 'bg-silver/20 text-silver' };
              return (
                <Link key={sale.id} href={`/sales/${sale.id}`} className="card-surface p-4 flex justify-between items-center hover:border-electric/30 transition-colors block">
                  <div>
                    <p className="font-medium text-sm">Sale #{sale.id.slice(-8)}</p>
                    <p className="text-xs text-silver mt-1">
                      {sale.totalAmount ? `$${sale.totalAmount.toLocaleString()}` : sale.salePrice ? `$${sale.salePrice.toLocaleString()}` : 'Price TBD'}
                      {' • '}{new Date(sale.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`badge text-xs px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
