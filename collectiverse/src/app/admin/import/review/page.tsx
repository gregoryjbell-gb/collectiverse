'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ImportReviewPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/import/review')
      .then(r => { if (r.status === 403) { router.push('/admin'); return null; } return r.json(); })
      .then(d => { if (d) setBatches(d.batches || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Import Review</h1>
          <Link href="/admin/import" className="text-sm text-silver hover:text-electric">← Import</Link>
        </div>

        {batches.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <p className="text-silver">No batches to review.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {batches.map((batch: any) => (
              <Link key={batch.id} href={`/admin/import/review/${batch.id}`} className="card-surface p-4 hover:border-electric/30 transition-colors block">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{batch.sourceName}</p>
                    <p className="text-xs text-silver">{batch.importedRows} cards • {batch.fileName || 'Manual'} • {new Date(batch.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`badge text-xs ${batch.status === 'COMPLETED' ? 'bg-green-400/20 text-green-400' : 'bg-amber-400/20 text-amber-400'}`}>{batch.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
