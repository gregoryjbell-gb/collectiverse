'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function PublicProfilePage() {
  const { userId } = useParams();
  const [data, setData] = useState<any>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/reputation/${userId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/feedback?userId=${userId}`).then(r => r.ok ? r.json() : null),
    ]).then(([repData, fbData]) => {
      if (repData) setData(repData);
      if (fbData) setFeedback(fbData.feedback || []);
    }).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Profile not found.</div></main>;

  const { reputation: rep, seller } = data;
  const totalFb = rep.positiveFeedback + rep.neutralFeedback + rep.negativeFeedback;
  const positivePct = totalFb > 0 ? Math.round((rep.positiveFeedback / totalFb) * 100) : 0;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="card-surface p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-electric/20 flex items-center justify-center text-2xl font-bold text-electric">
              {seller.displayName?.charAt(0) || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{seller.displayName}</h1>
              <p className="text-silver text-sm">Member since {new Date(seller.memberSince).toLocaleDateString()}</p>
              {rep.verifiedCollector && <span className="badge bg-green-500/20 text-green-400 mt-1">✓ Verified Collector</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center"><p className="text-2xl font-bold text-electric">{rep.reputationScore}%</p><p className="text-xs text-silver">Score</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{rep.totalSales}</p><p className="text-xs text-silver">Sales</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{rep.completedTransfers}</p><p className="text-xs text-silver">Transfers</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-green-400">{positivePct}%</p><p className="text-xs text-silver">Positive</p></div>
          </div>

          <div className="flex gap-3 mt-4 text-xs text-silver">
            <span className="text-green-400">+{rep.positiveFeedback}</span>
            <span>~{rep.neutralFeedback}</span>
            <span className="text-red-400">-{rep.negativeFeedback}</span>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-3">Feedback ({feedback.length})</h2>
        {feedback.length === 0 ? <p className="text-silver text-sm">No feedback yet.</p> : (
          <div className="space-y-2">
            {feedback.map((fb: any) => (
              <div key={fb.id} className="card-surface p-3 flex justify-between items-start">
                <div>
                  <span className={`badge text-xs ${fb.rating === 'POSITIVE' ? 'bg-green-500/20 text-green-400' : fb.rating === 'NEGATIVE' ? 'bg-red-500/20 text-red-400' : 'bg-silver/10 text-silver'}`}>{fb.rating}</span>
                  {fb.comment && <p className="text-sm text-silver mt-1">{fb.comment}</p>}
                </div>
                <span className="text-[10px] text-silver/60">{new Date(fb.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
