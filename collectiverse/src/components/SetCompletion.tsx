'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Props {
  apiUrl: string; // e.g. /api/card-sets/{id}/completion or /api/inventory-groups/{id}/completion
}

export default function SetCompletion({ apiUrl }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'owned' | 'missing' | 'duplicates'>('owned');

  useEffect(() => {
    fetch(apiUrl)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiUrl]);

  if (loading) return <div className="text-silver text-sm py-4">Loading completion data...</div>;
  if (!data) return null;

  return (
    <div className="card-surface p-6">
      <h3 className="font-semibold mb-4">Set Completion</h3>

      {/* Progress */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="w-full bg-gunmetal rounded-full h-4">
            <div className="bg-electric h-4 rounded-full transition-all" style={{ width: `${Math.min(data.completionPercent, 100)}%` }} />
          </div>
        </div>
        <span className="text-2xl font-bold text-electric">{data.completionPercent}%</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center">
          <p className="text-lg font-bold">{data.totalCards}</p>
          <p className="text-xs text-silver">Total</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-400">{data.ownedUniqueCards}</p>
          <p className="text-xs text-silver">Owned</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-red-400">{data.missingCards}</p>
          <p className="text-xs text-silver">Missing</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-amber-400">{data.duplicates}</p>
          <p className="text-xs text-silver">Dupes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        {(['owned', 'missing', 'duplicates'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-colors ${tab === t ? 'bg-electric text-white' : 'bg-gunmetal/50 text-silver hover:text-white'}`}>
            {t} ({t === 'owned' ? data.owned.length : t === 'missing' ? data.missing.length : data.duplicatesList.length})
          </button>
        ))}
      </div>

      {/* List */}
      <div className="max-h-64 overflow-y-auto">
        {tab === 'owned' && (
          <table className="w-full text-xs">
            <thead><tr className="text-silver border-b border-silver/10"><th className="py-1 px-2 text-left">#</th><th className="py-1 px-2 text-left">Subject</th><th className="py-1 px-2">Qty</th></tr></thead>
            <tbody>
              {data.owned.map((c: any) => (
                <tr key={c.cardId} className="border-b border-silver/10">
                  <td className="py-1 px-2 text-silver">{c.cardNumber}</td>
                  <td className="py-1 px-2">{c.playerName} {c.parallel && <span className="text-electric">({c.parallel})</span>}</td>
                  <td className="py-1 px-2 text-center">{c.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'missing' && (
          <table className="w-full text-xs">
            <thead><tr className="text-silver border-b border-silver/10"><th className="py-1 px-2 text-left">#</th><th className="py-1 px-2 text-left">Subject</th><th className="py-1 px-2">Action</th></tr></thead>
            <tbody>
              {data.missing.map((c: any) => (
                <tr key={c.cardId} className="border-b border-silver/10">
                  <td className="py-1 px-2 text-silver">{c.cardNumber}</td>
                  <td className="py-1 px-2">{c.playerName} {c.parallel && <span className="text-electric">({c.parallel})</span>}</td>
                  <td className="py-1 px-2 text-center"><Link href={`/inventory/add?cardId=${c.cardId}`} className="text-electric hover:underline">Add</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'duplicates' && (
          <table className="w-full text-xs">
            <thead><tr className="text-silver border-b border-silver/10"><th className="py-1 px-2 text-left">#</th><th className="py-1 px-2 text-left">Subject</th><th className="py-1 px-2">Qty</th></tr></thead>
            <tbody>
              {data.duplicatesList.map((c: any) => (
                <tr key={c.cardId} className="border-b border-silver/10">
                  <td className="py-1 px-2 text-silver">{c.cardNumber}</td>
                  <td className="py-1 px-2">{c.playerName}</td>
                  <td className="py-1 px-2 text-center text-amber-400">{c.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
