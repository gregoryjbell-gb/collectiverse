'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Tab = 'cards' | 'people' | 'teams' | 'sets';

export default function DuplicatesPage() {
  const [tab, setTab] = useState<Tab>('cards');
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/duplicates/${tab}`)
      .then(r => { if (r.status === 403) { router.push('/admin'); return null; } return r.json(); })
      .then(d => { if (d) setDuplicates(d.duplicates || []); })
      .finally(() => setLoading(false));
  }, [tab]);

  const handleMerge = async (canonicalId: string, mergeIds: string[]) => {
    if (!confirm(`Merge ${mergeIds.length} records into the selected canonical? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/duplicates/${tab}/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canonicalId, mergeIds }),
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Merged successfully. Moved ${data.movedCards || data.movedInventory || 0} related records.`);
      setDuplicates(duplicates.filter(d => {
        const items = d.cards || d.persons || d.teams || d.sets || [];
        return !items.some((i: any) => mergeIds.includes(i.id));
      }));
    } else {
      const data = await res.json();
      alert(data.error || 'Merge failed');
    }
  };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Duplicate Detection</h1>
          <Link href="/admin" className="text-sm text-silver hover:text-electric">← Admin</Link>
        </div>

        <div className="flex gap-2 mb-6">
          {(['cards', 'people', 'teams', 'sets'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${tab === t ? 'bg-electric text-white' : 'bg-gunmetal/50 text-silver hover:text-white'}`}>{t}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-silver text-center">Scanning for duplicates...</div>
        ) : duplicates.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <p className="text-silver">No duplicates found for {tab}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-silver">{duplicates.length} duplicate group{duplicates.length > 1 ? 's' : ''} found</p>
            {duplicates.map((group, gi) => (
              <DuplicateGroup key={gi} group={group} tab={tab} onMerge={handleMerge} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function DuplicateGroup({ group, tab, onMerge }: { group: any; tab: Tab; onMerge: (canonicalId: string, mergeIds: string[]) => void }) {
  const [canonical, setCanonical] = useState<string>('');
  const items = group.cards || group.persons || group.teams || group.sets || [];

  if (items.length === 0) return null;
  if (!canonical && items.length > 0) {
    // Default canonical to the one with most related records
    const sorted = [...items].sort((a: any, b: any) => (b._count?.cards || b._count?.inventoryItems || 0) - (a._count?.cards || a._count?.inventoryItems || 0));
    if (sorted[0] && !canonical) setCanonical(sorted[0].id);
  }

  const handleMerge = () => {
    const mergeIds = items.filter((i: any) => i.id !== canonical).map((i: any) => i.id);
    onMerge(canonical, mergeIds);
  };

  return (
    <div className="card-surface p-4">
      <p className="text-xs text-silver mb-3">Group: {group.key}</p>
      <div className="space-y-2 mb-3">
        {items.map((item: any) => (
          <div key={item.id} className={`flex items-center gap-3 p-2 rounded-lg ${canonical === item.id ? 'bg-electric/10 border border-electric/30' : 'bg-gunmetal/30'}`}>
            <input type="radio" name={`canonical-${group.key}`} checked={canonical === item.id} onChange={() => setCanonical(item.id)} />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {tab === 'cards' && `${item.person?.displayName || '?'} - ${item.set?.name || '?'} #${item.cardNumber || '?'}`}
                {tab === 'people' && item.displayName}
                {tab === 'teams' && `${item.name} (${item.sport?.name || '?'})`}
                {tab === 'sets' && `${item.name} (${item.year}) - ${item.manufacturer || '?'}`}
              </p>
              <p className="text-xs text-silver">
                ID: {item.id.slice(-8)}
                {item._count?.cards !== undefined && ` • ${item._count.cards} cards`}
                {item._count?.inventoryItems !== undefined && ` • ${item._count.inventoryItems} in inventory`}
                {item.parallel && ` • Parallel: ${item.parallel}`}
              </p>
            </div>
            {canonical === item.id && <span className="badge bg-electric/20 text-electric text-xs">Canonical</span>}
          </div>
        ))}
      </div>
      <button onClick={handleMerge} disabled={!canonical} className="btn-primary text-xs">Merge into Canonical</button>
    </div>
  );
}
