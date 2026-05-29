'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CardIdentitiesPage() {
  const [identities, setIdentities] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const router = useRouter();

  const load = (q?: string) => {
    setLoading(true);
    const params = q ? `?search=${encodeURIComponent(q)}` : '';
    fetch(`/api/admin/card-identities${params}`)
      .then(r => { if (r.status === 403) { router.push('/admin'); return null; } return r.json(); })
      .then(d => { if (d) { setIdentities(d.identities || []); setTotal(d.total || 0); } })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetch('/api/admin/card-identities/conflicts')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setConflicts(d); });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search);
  };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Card Identities</h1>
          <Link href="/admin" className="text-sm text-silver hover:text-electric">← Admin</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card-surface p-4 text-center">
            <p className="text-2xl font-bold text-electric">{total}</p>
            <p className="text-xs text-silver">Total Identities</p>
          </div>
          <div className="card-surface p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{conflicts?.cardsWithoutIdentity || 0}</p>
            <p className="text-xs text-silver">Cards Without Identity</p>
          </div>
          <Link href="/admin/card-identities/conflicts" className="card-surface p-4 text-center hover:border-electric/30 transition-colors">
            <p className="text-2xl font-bold text-red-400">{conflicts?.potentialConflicts?.length || 0}</p>
            <p className="text-xs text-silver">Potential Conflicts</p>
          </Link>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input className="input-field flex-1" placeholder="Search by player, set, or fingerprint..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn-primary text-sm">Search</button>
        </form>

        {/* Identities list */}
        {loading ? (
          <div className="text-silver text-center">Loading...</div>
        ) : identities.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <p className="text-silver">No card identities found. Import cards to generate identities.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {identities.map((id: any) => (
              <div key={id.id} className="card-surface p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{id.subjectName || 'Unknown'} — {id.setName || 'Unknown Set'} #{id.cardNumber || '?'}</p>
                  <p className="text-xs text-silver font-mono">{id.fingerprint}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-silver">{id.year || '?'} • {id.manufacturer || '?'}</p>
                  {id.parallel && <span className="badge bg-electric/20 text-electric text-xs">{id.parallel}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
