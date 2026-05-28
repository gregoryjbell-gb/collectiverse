'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PRIORITY_COLORS: Record<string, string> = { LOW: 'bg-silver/10 text-silver', MEDIUM: 'bg-electric/20 text-electric', HIGH: 'bg-amber-500/20 text-amber-400', GRAIL: 'bg-red-500/20 text-red-400' };

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/wishlist')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setItems(d.items || []); })
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove from wishlist?')) return;
    await fetch(`/api/wishlist/${id}`, { method: 'DELETE' });
    setItems(items.filter(i => i.id !== id));
  };

  const markAcquired = async (id: string) => {
    await fetch(`/api/wishlist/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ACQUIRED' }) });
    setItems(items.map(i => i.id === id ? { ...i, status: 'ACQUIRED' } : i));
  };

  const totalTarget = items.filter(i => i.status === 'ACTIVE').reduce((s, i) => s + (i.targetPrice || 0), 0);
  const grails = items.filter(i => i.priority === 'GRAIL' && i.status === 'ACTIVE');

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Wishlist</h1>
            <p className="text-silver text-sm">{items.filter(i => i.status === 'ACTIVE').length} targets • ${totalTarget.toLocaleString()} estimated cost</p>
          </div>
          <Link href="/wishlist/add" className="btn-primary text-sm">+ Add Target</Link>
        </div>

        {grails.length > 0 && (
          <div className="card-surface p-4 mb-6 border border-red-500/20">
            <h2 className="text-sm font-semibold text-red-400 mb-2">🎯 Grails ({grails.length})</h2>
            <div className="space-y-1">
              {grails.map((g: any) => (
                <div key={g.id} className="flex justify-between text-sm">
                  <span>{g.card?.person?.displayName || g.cardSet?.name || g.collectibleCategory || 'Target'}</span>
                  {g.targetPrice && <span className="text-electric">${g.targetPrice}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? <div className="text-silver text-center py-12">Loading...</div> : items.length === 0 ? (
          <div className="card-surface p-12 text-center"><p className="text-silver">No wishlist items yet.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-silver/20 text-left text-silver text-xs">
                <th className="py-2 px-2">Priority</th><th className="py-2 px-2">Target</th><th className="py-2 px-2">Details</th><th className="py-2 px-2">Grade</th><th className="py-2 px-2">Price</th><th className="py-2 px-2">Status</th><th className="py-2 px-2">Actions</th>
              </tr></thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b border-silver/10 hover:bg-silver/5">
                    <td className="py-2 px-2"><span className={`badge text-xs ${PRIORITY_COLORS[item.priority] || ''}`}>{item.priority}</span></td>
                    <td className="py-2 px-2 font-medium">{item.card?.person?.displayName || item.cardSet?.name || item.collectibleCategory || '—'}</td>
                    <td className="py-2 px-2 text-silver text-xs">{item.card ? `${item.card.set?.name} #${item.card.cardNumber}` : item.cardSet ? `${item.cardSet.year} • ${item.cardSet.manufacturer}` : '—'}</td>
                    <td className="py-2 px-2 text-silver text-xs">{item.desiredGradeCompany ? `${item.desiredGradeCompany} ${item.desiredGradeValue || ''}` : '—'}</td>
                    <td className="py-2 px-2 text-electric">{item.targetPrice ? `$${item.targetPrice}` : '—'}</td>
                    <td className="py-2 px-2"><span className={`badge text-xs ${item.status === 'ACQUIRED' ? 'bg-green-500/20 text-green-400' : 'bg-silver/10 text-silver'}`}>{item.status}</span></td>
                    <td className="py-2 px-2">
                      <div className="flex gap-2">
                        {item.status === 'ACTIVE' && <button onClick={() => markAcquired(item.id)} className="text-green-400 text-xs hover:underline">Got It</button>}
                        {item.card && <Link href={`/inventory/add?cardId=${item.cardId}`} className="text-electric text-xs hover:underline">Add</Link>}
                        <button onClick={() => handleDelete(item.id)} className="text-red-400 text-xs hover:underline">Del</button>
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
