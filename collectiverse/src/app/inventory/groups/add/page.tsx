'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const GROUP_TYPES = ['COMPLETE_SET', 'PARTIAL_SET', 'LOT', 'BINDER', 'BOX', 'PACK', 'CASE', 'SEALED_PRODUCT', 'OPENED_PRODUCT'];

export default function AddGroupPage() {
  const router = useRouter();
  const [sets, setSets] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', groupType: 'LOT', cardSetId: '', sealed: false, quantity: '1',
    purchasePrice: '', estimatedValue: '', askingPrice: '', acquisitionDate: '',
    storageLocation: '', notes: '', description: '',
  });

  useEffect(() => {
    fetch('/api/inventory/options').then(r => r.ok ? r.json() : null).then(d => { if (d?.sets) setSets(d.sets); }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/inventory-groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      router.push('/inventory/groups');
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/inventory/groups" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back</Link>
        <h1 className="text-2xl font-bold mb-6">Create Group</h1>
        <form onSubmit={handleSubmit} className="card-surface p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-silver block mb-1">Name *</label><input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div><label className="text-sm text-silver block mb-1">Type *</label>
              <select className="input-field" value={form.groupType} onChange={e => setForm({...form, groupType: e.target.value})}>
                {GROUP_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div><label className="text-sm text-silver block mb-1">Description</label><textarea className="input-field min-h-[60px]" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div><label className="text-sm text-silver block mb-1">Link to Card Set (optional)</label>
            <select className="input-field" value={form.cardSetId} onChange={e => setForm({...form, cardSetId: e.target.value})}>
              <option value="">None</option>
              {sets.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-sm text-silver block mb-1">Quantity</label><input type="number" min="1" className="input-field" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} /></div>
            <div><label className="text-sm text-silver block mb-1">Purchase ($)</label><input type="number" step="0.01" className="input-field" value={form.purchasePrice} onChange={e => setForm({...form, purchasePrice: e.target.value})} /></div>
            <div><label className="text-sm text-silver block mb-1">Value ($)</label><input type="number" step="0.01" className="input-field" value={form.estimatedValue} onChange={e => setForm({...form, estimatedValue: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-silver block mb-1">Acquisition Date</label><input type="date" className="input-field" value={form.acquisitionDate} onChange={e => setForm({...form, acquisitionDate: e.target.value})} /></div>
            <div><label className="text-sm text-silver block mb-1">Storage Location</label><input className="input-field" value={form.storageLocation} onChange={e => setForm({...form, storageLocation: e.target.value})} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-silver cursor-pointer"><input type="checkbox" checked={form.sealed} onChange={e => setForm({...form, sealed: e.target.checked})} /> Sealed Product</label>
          <div><label className="text-sm text-silver block mb-1">Notes</label><textarea className="input-field min-h-[60px]" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3"><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Group'}</button><Link href="/inventory/groups" className="btn-secondary">Cancel</Link></div>
        </form>
      </div>
    </main>
  );
}
