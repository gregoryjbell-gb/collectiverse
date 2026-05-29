'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CardReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = () => {
    fetch('/api/admin/card-reviews')
      .then(r => { if (r.status === 403) { router.push('/admin'); return null; } return r.json(); })
      .then(d => { if (d) { setReviews(d.reviews || []); setCounts(d.counts || {}); } })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (reviewId: string, action: string, body?: any) => {
    const res = await fetch(`/api/admin/card-reviews/${reviewId}/${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    if (res.ok) { setReviews(reviews.filter(r => r.id !== reviewId)); }
    else { const d = await res.json(); alert(d.error || 'Action failed'); }
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Card Reviews</h1>
          <Link href="/admin" className="text-sm text-silver hover:text-electric">← Admin</Link>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card-surface p-4 text-center"><p className="text-xl font-bold text-amber-400">{counts.pending || 0}</p><p className="text-xs text-silver">Pending</p></div>
          <div className="card-surface p-4 text-center"><p className="text-xl font-bold text-green-400">{counts.approved || 0}</p><p className="text-xs text-silver">Approved</p></div>
          <div className="card-surface p-4 text-center"><p className="text-xl font-bold text-blue-400">{counts.merged || 0}</p><p className="text-xs text-silver">Merged</p></div>
          <div className="card-surface p-4 text-center"><p className="text-xl font-bold text-red-400">{counts.rejected || 0}</p><p className="text-xs text-silver">Rejected</p></div>
        </div>

        {reviews.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <p className="text-green-400 font-medium">No pending reviews</p>
            <p className="text-silver text-sm mt-1">All user-imported cards have been reviewed.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review: any) => (
              <div key={review.id} className="card-surface p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-sm">{review.card?.person?.displayName || 'Unknown'}</p>
                    <p className="text-xs text-silver">{review.card?.set?.name || '?'} #{review.card?.cardNumber || '?'} ({review.card?.set?.year || '?'})</p>
                    <p className="text-xs text-silver mt-1">
                      {review.card?.team?.name && `${review.card.team.name} • `}
                      {review.card?._count?.inventoryItems || 0} inventory items linked
                    </p>
                  </div>
                  <span className="badge bg-amber-400/20 text-amber-400 text-xs">PENDING</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => handleAction(review.id, 'approve')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-400/10 text-green-400 hover:bg-green-400/20 transition-colors">Approve</button>
                  <button onClick={() => {
                    const canonicalId = prompt('Enter canonical card ID to merge into:');
                    if (canonicalId) handleAction(review.id, 'merge', { canonicalCardId: canonicalId });
                  }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors">Merge</button>
                  <button onClick={() => handleAction(review.id, 'reject')} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors">Reject</button>
                  <button onClick={() => handleAction(review.id, 'needs-more-info', { notes: prompt('Notes for user:') })} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-silver/10 text-silver hover:bg-silver/20 transition-colors">Need Info</button>
                  <Link href={`/admin/card-reviews/${review.id}`} className="px-3 py-1.5 rounded-lg text-xs font-medium text-electric hover:bg-electric/10 transition-colors">Details →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
