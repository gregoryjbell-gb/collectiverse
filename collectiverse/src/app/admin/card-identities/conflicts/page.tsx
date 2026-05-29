'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CardIdentityConflictsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/card-identities/conflicts')
      .then(r => { if (r.status === 403) { router.push('/admin'); return null; } return r.json(); })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return null;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Identity Conflicts</h1>
          <Link href="/admin/card-identities" className="text-sm text-silver hover:text-electric">← Identities</Link>
        </div>

        {/* Cards without identity */}
        {data.cardsWithoutIdentity > 0 && (
          <div className="card-surface p-5 mb-6">
            <h2 className="font-semibold text-sm mb-3 text-amber-400">Cards Without Identity ({data.cardsWithoutIdentity})</h2>
            <p className="text-xs text-silver mb-3">These cards need fingerprints generated. They may have been created before the identity system.</p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {data.cardsWithoutIdentityList?.map((card: any) => (
                <div key={card.id} className="flex justify-between text-xs py-1 border-b border-silver/5">
                  <span>{card.person?.displayName || '?'} — {card.set?.name || '?'} #{card.cardNumber || '?'}</span>
                  <span className="text-silver">{card.set?.year || '?'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Potential conflicts */}
        {data.potentialConflicts?.length > 0 ? (
          <div className="space-y-4">
            <h2 className="font-semibold">Potential Fingerprint Conflicts ({data.potentialConflicts.length})</h2>
            {data.potentialConflicts.map((conflict: any, i: number) => (
              <div key={i} className="card-surface p-4">
                <p className="text-xs text-silver mb-2 font-mono">{conflict.baseFingerprint}</p>
                <div className="space-y-1">
                  {conflict.identities.map((id: any) => (
                    <div key={id.id} className="flex justify-between items-center bg-gunmetal/30 rounded p-2">
                      <div>
                        <p className="text-sm">{id.subjectName} — {id.setName} #{id.cardNumber}</p>
                        <p className="text-xs text-silver font-mono">{id.fingerprint}</p>
                      </div>
                      {id.parallel && <span className="badge bg-electric/20 text-electric text-xs">{id.parallel}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-surface p-8 text-center">
            <p className="text-green-400 font-medium">No fingerprint conflicts detected</p>
            <p className="text-silver text-sm mt-1">All card identities are unique.</p>
          </div>
        )}
      </div>
    </main>
  );
}
