'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ChecklistDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'owned' | 'missing'>('all');

  useEffect(() => {
    fetch(`/api/checklists/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return <main className="min-h-screen py-12 px-6"><div className="text-center"><p className="text-silver">Checklist not found.</p><Link href="/checklists" className="text-electric hover:underline">Back to Checklists</Link></div></main>;

  const { checklist, completion, ownedCardIds } = data;
  const cards = checklist.cards || [];

  const filteredCards = cards.filter((c: any) => {
    if (filter === 'owned') return ownedCardIds.includes(c.cardId);
    if (filter === 'missing') return !ownedCardIds.includes(c.cardId);
    return true;
  });

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/checklists" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; All Checklists</Link>

        <div className="card-surface p-6 mb-6">
          <h1 className="text-2xl font-bold mb-1">{checklist.name}</h1>
          {checklist.description && <p className="text-silver text-sm mb-4">{checklist.description}</p>}

          {/* Completion stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-electric">{completion.total}</p>
              <p className="text-xs text-silver">Total Cards</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{completion.owned}</p>
              <p className="text-xs text-silver">Owned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{completion.missing}</p>
              <p className="text-xs text-silver">Missing</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{completion.percent}%</p>
              <p className="text-xs text-silver">Complete</p>
            </div>
          </div>

          {/* Progress bar */}
          {completion.total > 0 && (
            <div className="mt-4 h-3 bg-gunmetal/50 rounded-full overflow-hidden">
              <div className="h-full bg-electric rounded-full transition-all" style={{ width: `${completion.percent}%` }} />
            </div>
          )}
        </div>

        {/* Parallels & Inserts */}
        {(checklist.parallels?.length > 0 || checklist.inserts?.length > 0) && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {checklist.parallels?.length > 0 && (
              <div className="card-surface p-5">
                <h3 className="font-semibold text-sm mb-3">Parallels ({checklist.parallels.length})</h3>
                <div className="space-y-1">
                  {checklist.parallels.map((p: any) => (
                    <div key={p.id} className="flex justify-between text-xs py-1 border-b border-silver/5 last:border-0">
                      <span>{p.name}</span>
                      <span className="text-silver">{p.serialNumbered ? `/${p.printRun || '?'}` : p.printRun ? `${p.printRun}` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {checklist.inserts?.length > 0 && (
              <div className="card-surface p-5">
                <h3 className="font-semibold text-sm mb-3">Inserts ({checklist.inserts.length})</h3>
                <div className="space-y-1">
                  {checklist.inserts.map((ins: any) => (
                    <div key={ins.id} className="flex justify-between text-xs py-1 border-b border-silver/5 last:border-0">
                      <span>{ins.name}</span>
                      <span className="text-silver">{ins.insertType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Card list */}
        <div className="card-surface p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm">Cards ({filteredCards.length})</h3>
            <div className="flex gap-2">
              {(['all', 'owned', 'missing'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded text-xs capitalize ${filter === f ? 'bg-electric text-white' : 'bg-gunmetal/50 text-silver'}`}>{f}</button>
              ))}
            </div>
          </div>

          {filteredCards.length === 0 ? (
            <p className="text-silver text-sm text-center py-4">No cards match this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-silver/20 text-silver text-left">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Card</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2">SP</th>
                </tr></thead>
                <tbody>
                  {filteredCards.map((card: any) => {
                    const isOwned = ownedCardIds.includes(card.cardId);
                    return (
                      <tr key={card.id} className={`border-b border-silver/10 ${isOwned ? 'bg-green-400/5' : ''}`}>
                        <td className="py-1.5 px-2 font-mono">{card.checklistNumber}</td>
                        <td className="py-1.5 px-2">
                          {card.cardId ? <Link href={`/cards/${card.cardId}`} className="hover:text-electric">{card.checklistNumber}</Link> : card.checklistNumber}
                        </td>
                        <td className="py-1.5 px-2">
                          {isOwned ? <span className="text-green-400">✓ Owned</span> : <span className="text-silver">—</span>}
                        </td>
                        <td className="py-1.5 px-2">
                          {card.isShortPrint && <span className="text-amber-400">SP</span>}
                          {card.isSuperShortPrint && <span className="text-red-400">SSP</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
