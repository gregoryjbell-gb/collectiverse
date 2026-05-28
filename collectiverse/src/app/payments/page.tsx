'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-silver/10 text-silver', PENDING: 'bg-amber-500/20 text-amber-400', AUTHORIZED: 'bg-electric/20 text-electric',
  PAID: 'bg-green-500/20 text-green-400', FAILED: 'bg-red-500/20 text-red-400', CANCELLED: 'bg-silver/10 text-silver',
  REFUNDED: 'bg-purple-500/20 text-purple-400', PARTIALLY_REFUNDED: 'bg-purple-500/20 text-purple-400',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/payments')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setPayments(d.payments || []); })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Payments</h1>
        {loading ? <div className="text-silver text-center py-12">Loading...</div> : payments.length === 0 ? (
          <div className="card-surface p-12 text-center"><p className="text-silver">No payments.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-silver/20 text-left text-silver text-xs">
                <th className="py-2 px-2">Amount</th><th className="py-2 px-2">Currency</th><th className="py-2 px-2">Status</th><th className="py-2 px-2">Provider</th><th className="py-2 px-2">Paid</th><th className="py-2 px-2">Created</th>
              </tr></thead>
              <tbody>
                {payments.map((p: any) => (
                  <tr key={p.id} className="border-b border-silver/10 hover:bg-silver/5">
                    <td className="py-2 px-2 text-electric font-bold">${p.amount}</td>
                    <td className="py-2 px-2 text-silver">{p.currency}</td>
                    <td className="py-2 px-2"><span className={`badge text-xs ${STATUS_COLORS[p.status] || ''}`}>{p.status}</span></td>
                    <td className="py-2 px-2 text-silver text-xs">{p.provider || 'Manual'}</td>
                    <td className="py-2 px-2 text-silver text-xs">{p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}</td>
                    <td className="py-2 px-2 text-silver text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
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
