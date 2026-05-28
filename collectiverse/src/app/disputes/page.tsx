'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/disputes')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setDisputes(d.disputes || []); })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Disputes</h1>
        {loading ? <div className="text-silver text-center py-12">Loading...</div> : disputes.length === 0 ? (
          <div className="card-surface p-12 text-center"><p className="text-silver">No disputes.</p></div>
        ) : (
          <div className="space-y-3">
            {disputes.map((d: any) => (
              <Link key={d.id} href={`/disputes/${d.id}`} className="card-surface p-4 flex justify-between items-center hover:border-electric/30 transition-colors block">
                <div>
                  <div className="flex gap-2 mb-1">
                    <span className={`badge text-xs ${d.status === 'OPEN' ? 'bg-red-500/20 text-red-400' : d.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{d.status}</span>
                    <span className="badge bg-silver/10 text-silver text-xs">{d.reason.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-sm text-silver truncate max-w-md">{d.description}</p>
                </div>
                <span className="text-xs text-silver">{new Date(d.createdAt).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
