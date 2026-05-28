'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function InventoryGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/inventory-groups')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setGroups(d.groups || []); })
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this group?')) return;
    await fetch(`/api/inventory-groups/${id}`, { method: 'DELETE' });
    setGroups(groups.filter(g => g.id !== id));
  };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Sets, Lots & Sealed Products</h1>
          <Link href="/inventory/groups/add" className="btn-primary text-sm">+ Add Group</Link>
        </div>

        {loading ? <div className="text-silver text-center py-12">Loading...</div> : groups.length === 0 ? (
          <div className="card-surface p-12 text-center">
            <p className="text-silver text-lg mb-4">No groups yet</p>
            <Link href="/inventory/groups/add" className="btn-primary">Create Your First Group</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-silver/20 text-left text-silver text-xs">
                <th className="py-2 px-2">Name</th><th className="py-2 px-2">Type</th><th className="py-2 px-2">Card Set</th><th className="py-2 px-2">Sealed</th><th className="py-2 px-2">Items</th><th className="py-2 px-2">Value</th><th className="py-2 px-2">Status</th><th className="py-2 px-2">Location</th><th className="py-2 px-2">Actions</th>
              </tr></thead>
              <tbody>
                {groups.map((g: any) => (
                  <tr key={g.id} className="border-b border-silver/10 hover:bg-silver/5">
                    <td className="py-2 px-2 font-medium">{g.name}</td>
                    <td className="py-2 px-2"><span className="badge bg-electric/20 text-electric text-xs">{g.groupType}</span></td>
                    <td className="py-2 px-2 text-silver text-xs">{g.cardSet?.name ? `${g.cardSet.name} (${g.cardSet.year})` : '—'}</td>
                    <td className="py-2 px-2">{g.sealed ? <span className="text-amber-400">🔒</span> : '—'}</td>
                    <td className="py-2 px-2 text-silver">{g._count?.items || 0}</td>
                    <td className="py-2 px-2 text-electric">{g.estimatedValue ? `$${g.estimatedValue.toLocaleString()}` : '—'}</td>
                    <td className="py-2 px-2"><span className={`badge text-xs ${g.status === 'FOR_SALE' ? 'bg-green-500/20 text-green-400' : g.status === 'SOLD' ? 'bg-red-500/20 text-red-400' : 'bg-silver/10 text-silver'}`}>{g.status}</span></td>
                    <td className="py-2 px-2 text-silver text-xs">{g.storageLocation || '—'}</td>
                    <td className="py-2 px-2">
                      <div className="flex gap-2">
                        <Link href={`/inventory/groups/${g.id}`} className="text-electric text-xs hover:underline">View</Link>
                        <button onClick={() => handleDelete(g.id)} className="text-red-400 text-xs hover:underline">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
