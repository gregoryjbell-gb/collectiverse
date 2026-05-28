'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SetCompletion from '@/components/SetCompletion';

function SetCompletionInline({ groupId, cardSetId }: { groupId: string; cardSetId?: string }) {
  if (!cardSetId) return null;
  return <SetCompletion apiUrl={`/api/inventory-groups/${groupId}/completion`} />;
}

export default function GroupDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadGroup = () => {
    fetch(`/api/inventory-groups/${id}`)
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } if (!r.ok) { router.push('/inventory/groups'); return null; } return r.json(); })
      .then(d => { if (d) setGroup(d.group); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadGroup(); }, [id]);

  const handleOpen = async () => {
    if (!confirm('Open this sealed product? This cannot be undone.')) return;
    await fetch(`/api/inventory-groups/${id}/open`, { method: 'POST' });
    loadGroup();
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm('Remove this item from the group?')) return;
    await fetch(`/api/inventory-groups/${id}/items/${itemId}`, { method: 'DELETE' });
    loadGroup();
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!group) return null;

  const totalItemValue = (group.items || []).reduce((s: number, gi: any) => s + (gi.inventoryItem?.estimatedValue || 0) * gi.quantity, 0);
  const completionPct = group.cardSet?._count?.cards ? Math.round(((group.items?.length || 0) / group.cardSet._count.cards) * 100) : null;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/inventory/groups" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back to Groups</Link>

        <div className="card-surface p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-1">{group.name}</h1>
              <div className="flex gap-2 mb-2">
                <span className="badge bg-electric/20 text-electric text-xs">{group.groupType.replace(/_/g, ' ')}</span>
                <span className={`badge text-xs ${group.status === 'FOR_SALE' ? 'bg-green-500/20 text-green-400' : group.status === 'SOLD' ? 'bg-red-500/20 text-red-400' : 'bg-silver/10 text-silver'}`}>{group.status}</span>
                {group.sealed && <span className="badge bg-amber-500/20 text-amber-400 text-xs">🔒 Sealed</span>}
              </div>
              {group.description && <p className="text-silver text-sm">{group.description}</p>}
            </div>
            <div className="flex gap-2">
              {group.sealed && <button onClick={handleOpen} className="btn-secondary text-xs">Open / Break</button>}
              <Link href={`/inventory/groups/${id}/edit`} className="btn-primary text-xs">Edit</Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="card-surface p-5">
            <h3 className="font-semibold mb-3">Details</h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {group.cardSet && <><dt className="text-silver">Card Set</dt><dd>{group.cardSet.name} ({group.cardSet.year})</dd></>}
              <dt className="text-silver">Quantity</dt><dd>{group.quantity}</dd>
              {group.purchasePrice != null && <><dt className="text-silver">Purchase</dt><dd>${group.purchasePrice.toLocaleString()}</dd></>}
              {group.estimatedValue != null && <><dt className="text-silver">Value</dt><dd className="text-electric font-bold">${group.estimatedValue.toLocaleString()}</dd></>}
              {group.storageLocation && <><dt className="text-silver">Location</dt><dd>{group.storageLocation}</dd></>}
              {group.acquisitionDate && <><dt className="text-silver">Acquired</dt><dd>{new Date(group.acquisitionDate).toLocaleDateString()}</dd></>}
            </dl>
            {group.notes && <p className="text-xs text-silver mt-3 pt-3 border-t border-silver/10">{group.notes}</p>}
          </div>

          {completionPct !== null && (
            <SetCompletionInline groupId={id as string} cardSetId={group.cardSet?.id} />
          )}
        </div>

        {/* Items */}
        <div className="card-surface p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Items ({group.items?.length || 0}) • ${totalItemValue.toLocaleString()} value</h2>
          </div>
          {(group.items?.length || 0) === 0 ? (
            <p className="text-silver text-sm">No items in this group yet. Add cards from your inventory.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-silver/20 text-left text-silver text-xs">
                  <th className="py-2 px-2">Player</th><th className="py-2 px-2">Set</th><th className="py-2 px-2">#</th><th className="py-2 px-2">Qty</th><th className="py-2 px-2">Value</th><th className="py-2 px-2">Actions</th>
                </tr></thead>
                <tbody>
                  {group.items.map((gi: any) => (
                    <tr key={gi.id} className="border-b border-silver/10 hover:bg-silver/5">
                      <td className="py-2 px-2">{gi.inventoryItem?.card?.person?.displayName || '—'}</td>
                      <td className="py-2 px-2 text-silver text-xs">{gi.inventoryItem?.card?.set?.name || '—'}</td>
                      <td className="py-2 px-2 text-silver">{gi.inventoryItem?.card?.cardNumber || '—'}</td>
                      <td className="py-2 px-2">{gi.quantity}</td>
                      <td className="py-2 px-2 text-electric">{gi.inventoryItem?.estimatedValue ? `$${gi.inventoryItem.estimatedValue}` : '—'}</td>
                      <td className="py-2 px-2">
                        <button onClick={() => handleRemoveItem(gi.id)} className="text-red-400 text-xs hover:underline">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
