'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  cardId: string;
  initialData: {
    cardNumber?: string | null;
    year?: number | null;
    parallel?: string | null;
    rookie?: boolean;
    autograph?: boolean;
    relic?: boolean;
    serialNumber?: string | null;
    printRun?: number | null;
    estimatedValue?: number | null;
    gradingRecommendation?: string | null;
    status?: string;
    whyItMatters?: string | null;
    funFacts?: string[];
  };
}

export default function AdminEditCard({ cardId, initialData }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [form, setForm] = useState({
    cardNumber: initialData.cardNumber || '',
    year: initialData.year?.toString() || '',
    parallel: initialData.parallel || '',
    rookie: initialData.rookie || false,
    autograph: initialData.autograph || false,
    relic: initialData.relic || false,
    serialNumber: initialData.serialNumber || '',
    printRun: initialData.printRun?.toString() || '',
    estimatedValue: initialData.estimatedValue?.toString() || '',
    gradingRecommendation: initialData.gradingRecommendation || '',
    status: initialData.status || 'hold',
    whyItMatters: initialData.whyItMatters || '',
    funFacts: (initialData.funFacts || []).join('\n'),
  });

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.user?.role === 'ADMIN') setIsAdmin(true);
    }).catch(() => {});
  }, []);

  if (!isAdmin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body: any = {
        cardNumber: form.cardNumber || null,
        year: form.year ? parseInt(form.year) : null,
        parallel: form.parallel || null,
        rookie: form.rookie,
        autograph: form.autograph,
        relic: form.relic,
        serialNumber: form.serialNumber || null,
        printRun: form.printRun ? parseInt(form.printRun) : null,
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : null,
        gradingRecommendation: form.gradingRecommendation || null,
        status: form.status,
        whyItMatters: form.whyItMatters || null,
        funFacts: form.funFacts.split('\n').filter((f: string) => f.trim()),
      };

      const res = await fetch(`/api/admin/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm w-full justify-center mt-4">
        ✏️ Edit Card (Admin)
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface p-5 mt-4 space-y-3 border-amber-500/30 border">
      <h3 className="font-semibold text-amber-400 text-sm">Admin: Edit Card</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-silver block mb-1">Card Number</label>
          <input className="input-field text-sm" value={form.cardNumber} onChange={e => setForm({...form, cardNumber: e.target.value})} />
        </div>
        <div>
          <label className="text-xs text-silver block mb-1">Year</label>
          <input type="number" className="input-field text-sm" value={form.year} onChange={e => setForm({...form, year: e.target.value})} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-silver block mb-1">Parallel</label>
          <input className="input-field text-sm" value={form.parallel} onChange={e => setForm({...form, parallel: e.target.value})} />
        </div>
        <div>
          <label className="text-xs text-silver block mb-1">Serial Number</label>
          <input className="input-field text-sm" value={form.serialNumber} onChange={e => setForm({...form, serialNumber: e.target.value})} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-silver block mb-1">Print Run</label>
          <input type="number" className="input-field text-sm" value={form.printRun} onChange={e => setForm({...form, printRun: e.target.value})} />
        </div>
        <div>
          <label className="text-xs text-silver block mb-1">Estimated Value ($)</label>
          <input type="number" step="0.01" className="input-field text-sm" value={form.estimatedValue} onChange={e => setForm({...form, estimatedValue: e.target.value})} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-silver cursor-pointer">
          <input type="checkbox" checked={form.rookie} onChange={e => setForm({...form, rookie: e.target.checked})} className="rounded" /> Rookie
        </label>
        <label className="flex items-center gap-2 text-sm text-silver cursor-pointer">
          <input type="checkbox" checked={form.autograph} onChange={e => setForm({...form, autograph: e.target.checked})} className="rounded" /> Autograph
        </label>
        <label className="flex items-center gap-2 text-sm text-silver cursor-pointer">
          <input type="checkbox" checked={form.relic} onChange={e => setForm({...form, relic: e.target.checked})} className="rounded" /> Relic
        </label>
      </div>

      <div>
        <label className="text-xs text-silver block mb-1">Status</label>
        <select className="input-field text-sm" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
          <option value="hold">Hold</option>
          <option value="vault">Vault</option>
          <option value="sell">Sell</option>
          <option value="grade">Grade</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-silver block mb-1">Grading Recommendation</label>
        <input className="input-field text-sm" value={form.gradingRecommendation} onChange={e => setForm({...form, gradingRecommendation: e.target.value})} />
      </div>

      <div>
        <label className="text-xs text-silver block mb-1">Why This Card Matters</label>
        <textarea className="input-field text-sm min-h-[60px]" value={form.whyItMatters} onChange={e => setForm({...form, whyItMatters: e.target.value})} />
      </div>

      <div>
        <label className="text-xs text-silver block mb-1">Fun Facts (one per line)</label>
        <textarea className="input-field text-sm min-h-[60px]" value={form.funFacts} onChange={e => setForm({...form, funFacts: e.target.value})} />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm">Cancel</button>
      </div>
    </form>
  );
}
