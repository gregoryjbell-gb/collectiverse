'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CardReviewDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mergeCardId, setMergeCardId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetch(`/api/admin/card-reviews/${id}`)
      .then(r => { if (r.status === 403) { router.push('/admin'); return null; } return r.json(); })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (action: string, body?: any) => {
    const res = await fetch(`/api/admin/card-reviews/${id}/${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    if (res.ok) router.push('/admin/card-reviews');
    else { const d = await res.json(); alert(d.error || 'Failed'); }
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return null;

  const { review, card, fingerprint, similar, inventoryCount } = data;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Review Card</h1>
          <Link href="/admin/card-reviews" className="text-sm text-silver hover:text-electric">← All Reviews</Link>
        </div>

        {/* Card details */}
        <div className="card-surface p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold">{card?.person?.displayName || 'Unknown'}</h2>
              <p className="text-silver">{card?.set?.name} #{card?.cardNumber} ({card?.year})</p>
              {card?.team && <p className="text-silver text-sm">{card.team.name}</p>}
              {card?.parallel && <p className="text-sm"><span className="text-silver">Parallel:</span> {card.parallel}</p>}
            </div>
            <div className="text-right">
              <span className={`badge text-xs ${review.status === 'PENDING' ? 'bg-amber-400/20 text-amber-400' : 'bg-silver/20 text-silver'}`}>{review.status}</span>
              <p className="text-xs text-silver mt-1">{inventoryCount} inventory items linked</p>
            </div>
          </div>
          <div className="border-t border-silver/10 pt-3">
            <p className="text-xs text-silver">Fingerprint:</p>
            <p className="text-xs font-mono text-electric">{fingerprint}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
            <div><span className="text-silver">Source:</span> {card?.sourceType || '?'}</div>
            <div><span className="text-silver">Status:</span> {card?.publicDataStatus}</div>
            {card?.createdByUserId && <div><span className="text-silver">Created by:</span> {card.createdByUserId.slice(-8)}</div>}
            {review.importBatchId && <div><span className="text-silver">Import batch:</span> {review.importBatchId.slice(-8)}</div>}
          </div>
        </div>

        {/* Similar cards */}
        {similar?.length > 0 && (
          <div className="card-surface p-5 mb-6">
            <h3 className="font-semibold text-sm mb-3">Similar Existing Cards ({similar.length})</h3>
            <div className="space-y-2">
              {similar.map((s: any) => (
                <div key={s.id} className="flex justify-between items-center bg-gunmetal/30 rounded-lg p-3">
                  <div>
                    <p className="text-sm">{s.subjectName} — {s.setName} #{s.cardNumber}</p>
                    <p className="text-xs text-silver font-mono">{s.fingerprint}</p>
                  </div>
                  <button onClick={() => setMergeCardId(s.canonicalCardId)} className="text-electric text-xs hover:underline">Use as merge target</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="card-surface p-5">
          <h3 className="font-semibold text-sm mb-3">Actions</h3>
          <div className="space-y-3">
            <div><label className="text-xs text-silver">Admin Notes</label><textarea className="input-field text-sm min-h-[50px]" value={notes} onChange={e => setNotes(e.target.value)} /></div>

            <div className="flex gap-3 flex-wrap">
              <button onClick={() => handleAction('approve', { notes })} className="px-4 py-2 rounded-lg text-sm font-medium bg-green-400/10 text-green-400 hover:bg-green-400/20 transition-colors">Approve</button>
              <button onClick={() => handleAction('reject', { notes })} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors">Reject</button>
              <button onClick={() => handleAction('needs-more-info', { notes })} className="px-4 py-2 rounded-lg text-sm font-medium bg-silver/10 text-silver hover:bg-silver/20 transition-colors">Need More Info</button>
            </div>

            <div className="border-t border-silver/10 pt-3">
              <p className="text-xs text-silver mb-2">Merge into existing card:</p>
              <div className="flex gap-2">
                <input className="input-field text-sm flex-1" placeholder="Canonical card ID" value={mergeCardId} onChange={e => setMergeCardId(e.target.value)} />
                <button onClick={() => { if (mergeCardId) handleAction('merge', { canonicalCardId: mergeCardId, notes }); }} disabled={!mergeCardId} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-400/10 text-blue-400 hover:bg-blue-400/20 transition-colors disabled:opacity-50">Merge</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
