'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/transfers')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setTransfers(d.transfers || []); })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Transfers</h1>
          <Link href="/dashboard" className="text-sm text-silver hover:text-electric">← Dashboard</Link>
        </div>

        {transfers.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Transfers Yet</h2>
            <p className="text-silver text-sm mb-4">Transfers track ownership changes of items between users outside of marketplace sales.</p>
            <Link href="/inventory" className="btn-primary text-sm">Go to Inventory</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {transfers.map((t: any) => (
              <div key={t.id} className="card-surface p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{t.inventoryItem?.card?.person?.displayName || 'Item'}</p>
                  <p className="text-xs text-silver">To: {t.toUser?.username || t.toUserId} • {new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`badge text-xs ${t.status === 'COMPLETED' ? 'bg-green-400/20 text-green-400' : 'bg-amber-400/20 text-amber-400'}`}>{t.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
