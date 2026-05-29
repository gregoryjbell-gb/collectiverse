'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerificationPage() {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/verification/conflicts')
      .then(r => { if (r.status === 403) { router.push('/admin'); return null; } return r.json(); })
      .then(d => { if (d) setConflicts(d.conflicts || []); })
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async (cardId: string, fieldName: string, correctFactId: string, rejectFactIds: string[]) => {
    const res = await fetch(`/api/admin/cards/${cardId}/facts/resolve-conflict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldName, correctFactId, rejectFactIds }),
    });
    if (res.ok) {
      setConflicts(conflicts.filter(c => !(c.cardId === cardId && c.fieldName === fieldName)));
    }
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Data Verification</h1>
          <Link href="/admin" className="text-sm text-silver hover:text-electric">← Admin</Link>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card-surface p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{conflicts.length}</p>
            <p className="text-xs text-silver">Conflicts to Resolve</p>
          </div>
          <Link href="/admin/verification/conflicts" className="card-surface p-4 text-center hover:border-electric/30 transition-colors">
            <p className="text-sm font-medium text-electric">View All Conflicts →</p>
            <p className="text-xs text-silver mt-1">Review and resolve data disagreements</p>
          </Link>
        </div>

        {conflicts.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <p className="text-green-400 font-medium">No conflicts found</p>
            <p className="text-silver text-sm mt-1">All card facts are consistent across sources.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-semibold">Recent Conflicts</h2>
            {conflicts.slice(0, 20).map((conflict: any, i: number) => (
              <div key={i} className="card-surface p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-sm">{conflict.card?.person?.displayName || 'Unknown'} — {conflict.card?.set?.name || ''} #{conflict.card?.cardNumber || ''}</p>
                    <p className="text-xs text-silver">Field: <span className="text-amber-400">{conflict.fieldName}</span></p>
                  </div>
                  <span className="badge bg-amber-400/20 text-amber-400 text-xs">CONFLICTED</span>
                </div>
                <div className="space-y-2">
                  {conflict.facts.map((fact: any) => (
                    <div key={fact.id} className="flex items-center justify-between bg-gunmetal/30 rounded-lg p-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono">{fact.fieldValue}</span>
                        <span className="text-xs text-silver">via {fact.source?.name || 'Unknown'} (trust: {fact.source?.trustScore})</span>
                      </div>
                      <button
                        onClick={() => handleResolve(conflict.cardId, conflict.fieldName, fact.id, conflict.facts.filter((f: any) => f.id !== fact.id).map((f: any) => f.id))}
                        className="text-electric text-xs hover:underline"
                      >
                        Accept
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
