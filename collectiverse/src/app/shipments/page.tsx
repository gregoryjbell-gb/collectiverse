'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  NOT_SHIPPED: 'bg-silver/10 text-silver', LABEL_CREATED: 'bg-amber-500/20 text-amber-400', SHIPPED: 'bg-electric/20 text-electric',
  IN_TRANSIT: 'bg-electric/20 text-electric', OUT_FOR_DELIVERY: 'bg-green-500/20 text-green-400', DELIVERED: 'bg-green-500/20 text-green-400',
  DELAYED: 'bg-red-500/20 text-red-400', LOST: 'bg-red-500/20 text-red-400', RETURNED: 'bg-amber-500/20 text-amber-400', CANCELLED: 'bg-silver/10 text-silver',
};

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/shipments')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setShipments(d.shipments || []); })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Shipments</h1>
        {loading ? <div className="text-silver text-center py-12">Loading...</div> : shipments.length === 0 ? (
          <div className="card-surface p-12 text-center"><p className="text-silver">No shipments.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-silver/20 text-left text-silver text-xs">
                <th className="py-2 px-2">Carrier</th><th className="py-2 px-2">Tracking</th><th className="py-2 px-2">Status</th><th className="py-2 px-2">Shipped</th><th className="py-2 px-2">Delivered</th><th className="py-2 px-2">Actions</th>
              </tr></thead>
              <tbody>
                {shipments.map((s: any) => (
                  <tr key={s.id} className="border-b border-silver/10 hover:bg-silver/5">
                    <td className="py-2 px-2 font-medium">{s.carrier}</td>
                    <td className="py-2 px-2 text-silver text-xs">{s.trackingNumber || '—'}</td>
                    <td className="py-2 px-2"><span className={`badge text-xs ${STATUS_COLORS[s.shippingStatus] || ''}`}>{s.shippingStatus.replace(/_/g, ' ')}</span></td>
                    <td className="py-2 px-2 text-silver text-xs">{s.shippedAt ? new Date(s.shippedAt).toLocaleDateString() : '—'}</td>
                    <td className="py-2 px-2 text-silver text-xs">{s.deliveredAt ? new Date(s.deliveredAt).toLocaleDateString() : '—'}</td>
                    <td className="py-2 px-2">
                      {s.trackingUrl && <a href={s.trackingUrl} target="_blank" rel="noopener" className="text-electric text-xs hover:underline">Track</a>}
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
