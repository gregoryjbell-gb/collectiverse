'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

export default function WishlistAddWrapper() {
  return <Suspense fallback={<div className="min-h-screen py-12 px-6 text-silver text-center">Loading...</div>}><WishlistAddPage /></Suspense>;
}

function WishlistAddPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preCardId = searchParams.get('cardId') || '';
  const preSetId = searchParams.get('setId') || '';

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    cardId: preCardId, cardSetId: preSetId, collectibleCategory: '',
    priority: 'MEDIUM', targetPrice: '', desiredGradeCompany: '', desiredGradeValue: '', notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      router.push('/wishlist');
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-lg mx-auto">
        <Link href="/wishlist" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back</Link>
        <h1 className="text-2xl font-bold mb-6">Add to Wishlist</h1>
        <form onSubmit={handleSubmit} className="card-surface p-6 space-y-4">
          <div><label className="text-sm text-silver block mb-1">Card ID (from card page)</label><input className="input-field" value={form.cardId} onChange={e => setForm({...form, cardId: e.target.value})} placeholder="Optional — paste card ID" /></div>
          <div><label className="text-sm text-silver block mb-1">Card Set ID</label><input className="input-field" value={form.cardSetId} onChange={e => setForm({...form, cardSetId: e.target.value})} placeholder="Optional — for full set targets" /></div>
          <div><label className="text-sm text-silver block mb-1">Category (if no specific card)</label><input className="input-field" value={form.collectibleCategory} onChange={e => setForm({...form, collectibleCategory: e.target.value})} placeholder="e.g. 2024 Prizm Silver Josh Allen" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-silver block mb-1">Priority</label>
              <select className="input-field" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="GRAIL">Grail 🎯</option>
              </select>
            </div>
            <div><label className="text-sm text-silver block mb-1">Target Price ($)</label><input type="number" step="0.01" className="input-field" value={form.targetPrice} onChange={e => setForm({...form, targetPrice: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-silver block mb-1">Desired Grade Co.</label><input className="input-field" value={form.desiredGradeCompany} onChange={e => setForm({...form, desiredGradeCompany: e.target.value})} placeholder="PSA, BGS..." /></div>
            <div><label className="text-sm text-silver block mb-1">Desired Grade</label><input className="input-field" value={form.desiredGradeValue} onChange={e => setForm({...form, desiredGradeValue: e.target.value})} placeholder="9, 9.5, 10..." /></div>
          </div>
          <div><label className="text-sm text-silver block mb-1">Notes</label><textarea className="input-field min-h-[60px]" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3"><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Adding...' : 'Add to Wishlist'}</button><Link href="/wishlist" className="btn-secondary">Cancel</Link></div>
        </form>
      </div>
    </main>
  );
}
