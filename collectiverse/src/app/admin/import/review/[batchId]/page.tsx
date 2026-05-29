'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function BatchReviewPage() {
  const { batchId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/admin/import/review/${batchId}`)
      .then(r => { if (r.status === 403) { router.push('/admin'); return null; } return r.json(); })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [batchId]);

  const handleApprove = async () => {
    if (!confirm('Approve all cards in this batch?')) return;
    await fetch(`/api/admin/import/review/${batchId}/approve`, { method: 'POST' });
    router.push('/admin/import/review');
  };

  const handleFlag = async () => {
    if (selectedCards.length === 0) { alert('Select cards to flag'); return; }
    const reason = prompt('Reason for flagging?');
    await fetch(`/api/admin/import/review/${batchId}/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardIds: selectedCards, reason }),
    });
    alert(`Flagged ${selectedCards.length} cards`);
    setSelectedCards([]);
  };

  const toggleCard = (id: string) => {
    setSelectedCards(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return null;

  const { batch, cards, persons, errors } = data;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Review: {batch.sourceName}</h1>
          <Link href="/admin/import/review" className="text-sm text-silver hover:text-electric">← All Batches</Link>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card-surface p-4 text-center"><p className="text-xl font-bold text-electric">{batch.importedRows}</p><p className="text-xs text-silver">Imported</p></div>
          <div className="card-surface p-4 text-center"><p className="text-xl font-bold">{batch.skippedRows}</p><p className="text-xs text-silver">Skipped</p></div>
          <div className="card-surface p-4 text-center"><p className="text-xl font-bold">{persons.length}</p><p className="text-xs text-silver">Persons Created</p></div>
          <div className="card-surface p-4 text-center"><p className="text-xl font-bold">{batch.errorRows}</p><p className="text-xs text-silver">Errors</p></div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button onClick={handleApprove} className="btn-primary text-sm">Approve All</button>
          <button onClick={handleFlag} disabled={selectedCards.length === 0} className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 transition-colors disabled:opacity-50">Flag Selected ({selectedCards.length})</button>
        </div>

        {/* Cards table */}
        <div className="card-surface p-4 mb-6">
          <h3 className="font-semibold text-sm mb-3">Imported Cards ({cards.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-silver/20 text-silver text-left">
                <th className="py-2 px-2"><input type="checkbox" onChange={e => setSelectedCards(e.target.checked ? cards.map((c: any) => c.id) : [])} /></th>
                <th className="py-2 px-2">Player</th><th className="py-2 px-2">Set</th><th className="py-2 px-2">#</th><th className="py-2 px-2">Team</th><th className="py-2 px-2">RC</th><th className="py-2 px-2">Status</th>
              </tr></thead>
              <tbody>
                {cards.map((card: any) => (
                  <tr key={card.id} className="border-b border-silver/10 hover:bg-silver/5">
                    <td className="py-1.5 px-2"><input type="checkbox" checked={selectedCards.includes(card.id)} onChange={() => toggleCard(card.id)} /></td>
                    <td className="py-1.5 px-2 font-medium">{card.person?.displayName || '—'}</td>
                    <td className="py-1.5 px-2 text-silver">{card.set?.name} ({card.set?.year})</td>
                    <td className="py-1.5 px-2">{card.cardNumber}</td>
                    <td className="py-1.5 px-2 text-silver">{card.team?.name || '—'}</td>
                    <td className="py-1.5 px-2">{card.rookie ? '✓' : ''}</td>
                    <td className="py-1.5 px-2"><span className={`badge text-xs ${card.status === 'approved' ? 'bg-green-400/20 text-green-400' : card.status === 'needs_review' ? 'bg-amber-400/20 text-amber-400' : 'bg-silver/20 text-silver'}`}>{card.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="card-surface p-4">
            <h3 className="font-semibold text-sm mb-3 text-amber-400">Import Warnings ({errors.length})</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {errors.map((err: string, i: number) => (
                <p key={i} className="text-xs text-silver">{err}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
