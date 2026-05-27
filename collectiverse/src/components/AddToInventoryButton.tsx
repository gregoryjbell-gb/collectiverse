'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  cardId: string;
}

export default function AddToInventoryButton({ cardId }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [form, setForm] = useState({
    quantity: '1',
    condition: 'RAW',
    gradeCompany: '',
    gradeValue: '',
    certNumber: '',
    purchasePrice: '',
    estimatedValue: '',
    storageLocation: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/cards/${cardId}/add-to-inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      setSuccess(true);
      setTimeout(() => { setOpen(false); setSuccess(false); }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="card-surface p-4 border-green-500/30 border text-center">
        <p className="text-green-400 font-medium">✓ Added to your inventory!</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary w-full justify-center">
        + Add to My Inventory
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface p-5 space-y-3">
      <h3 className="font-semibold text-sm">Add to My Inventory</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-silver block mb-1">Quantity</label>
          <input type="number" min="1" className="input-field text-sm" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-silver block mb-1">Condition</label>
          <select className="input-field text-sm" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
            <option value="RAW">Raw</option>
            <option value="PSA">PSA</option>
            <option value="BGS">BGS</option>
            <option value="SGC">SGC</option>
            <option value="CGC">CGC</option>
          </select>
        </div>
      </div>

      {form.condition !== 'RAW' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-silver block mb-1">Grade</label>
            <input className="input-field text-sm" value={form.gradeValue} onChange={(e) => setForm({ ...form, gradeValue: e.target.value })} placeholder="e.g. 9.5" />
          </div>
          <div>
            <label className="text-xs text-silver block mb-1">Cert #</label>
            <input className="input-field text-sm" value={form.certNumber} onChange={(e) => setForm({ ...form, certNumber: e.target.value })} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-silver block mb-1">Purchase Price ($)</label>
          <input type="number" step="0.01" className="input-field text-sm" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-silver block mb-1">Estimated Value ($)</label>
          <input type="number" step="0.01" className="input-field text-sm" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="text-xs text-silver block mb-1">Storage Location</label>
        <input className="input-field text-sm" value={form.storageLocation} onChange={(e) => setForm({ ...form, storageLocation: e.target.value })} placeholder="e.g. Box A" />
      </div>

      <div>
        <label className="text-xs text-silver block mb-1">Notes (private)</label>
        <textarea className="input-field text-sm min-h-[50px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Adding...' : 'Add to Inventory'}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm">Cancel</button>
      </div>
    </form>
  );
}
