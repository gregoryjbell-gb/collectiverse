'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/checklists')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setChecklists(d.checklists || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Checklists</h1>
          <Link href="/sets" className="text-sm text-silver hover:text-electric">Browse Sets</Link>
        </div>

        {checklists.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Checklists Yet</h2>
            <p className="text-silver text-sm mb-4">Checklists are created when card data is imported. They track every card in a product release.</p>
            <Link href="/sets" className="btn-primary text-sm">Browse Sets</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {checklists.map((cl: any) => (
              <Link key={cl.id} href={`/checklists/${cl.id}`} className="card-surface p-4 hover:border-electric/30 transition-colors block">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{cl.name}</p>
                    {cl.description && <p className="text-xs text-silver mt-0.5">{cl.description}</p>}
                    <p className="text-xs text-silver mt-1">{cl._count?.cards || cl.totalCards || 0} cards • {cl._count?.parallels || 0} parallels • {cl._count?.inserts || 0} inserts</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-electric">{cl._count?.cards || cl.totalCards || 0}</p>
                    <p className="text-xs text-silver">cards</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
