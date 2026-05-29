'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/feedback')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setFeedback(d.feedback || []); })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Feedback &amp; Reputation</h1>
          <Link href="/dashboard" className="text-sm text-silver hover:text-electric">← Dashboard</Link>
        </div>

        {feedback.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Feedback Yet</h2>
            <p className="text-silver text-sm mb-4">Feedback and reputation scores are built through completed transactions with other users.</p>
            <Link href="/marketplace" className="btn-primary text-sm">Browse Marketplace</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {feedback.map((f: any) => (
              <div key={f.id} className="card-surface p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{f.fromUser?.username || 'User'}</p>
                    <p className="text-xs text-silver mt-1">{f.comment || 'No comment'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${f.rating >= 4 ? 'text-green-400' : f.rating >= 3 ? 'text-amber-400' : 'text-red-400'}`}>
                      {'★'.repeat(f.rating || 0)}{'☆'.repeat(5 - (f.rating || 0))}
                    </span>
                    <p className="text-xs text-silver">{new Date(f.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
