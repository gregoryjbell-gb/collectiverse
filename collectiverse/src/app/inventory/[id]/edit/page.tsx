'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditInventoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [cardInfo, setCardInfo] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/inventory/${id}`)
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null; }
        if (!r.ok) { router.push('/inventory'); return null; }
        return r.json();
      })
      .then(d => {
        if (d?.item) {
          const item = d.item;
          setCardInfo(item.card);
          setForm({
            quantity: String(item.quantity || 1),
            condition: item.condition || '',
            gradeCompany: item.gradeCompany || '',
            gradeValue: item.gradeValue || '',
            certNumber: item.certNumber || '',
            acquisitionDate: item.acquisitionDate ? item.acquisitionDate.split('T')[0] : '',
            purchasePrice: item.purchasePrice != null ? String(item.purchasePrice) : '',
            estimatedValue: item.estimatedValue != null ? String(item.estimatedValue) : '',
            askingPrice: item.askingPrice != null ? String(item.askingPrice) : '',
            status: item.status || 'OWNED',
            storageLocation: item.storageLocation || '',
            notes: item.notes || '',
            privateImageUrl: item.privateImageUrl || '',
            frontScanUrl: item.frontScanUrl || '',
            backScanUrl: item.backScanUrl || '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const validate = (): string | null => {
    const qty = parseInt(form.quantity);
    if (isNaN(qty) || qty < 1) return 'Quantity must be at least 1';
    if (form.purchasePrice && isNaN(parseFloat(form.purchasePrice))) return 'Purchase price must be a number';
    if (form.estimatedValue && isNaN(parseFloat(form.estimatedValue))) return 'Estimated value must be a number';
    if (form.askingPrice && isNaN(parseFloat(form.askingPrice))) return 'Asking price must be a number';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save');
      }
      router.push(`/inventory/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  }

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href={`/inventory/${id}`} className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back</Link>
        <h1 className="text-2xl font-bold mb-2">Edit Inventory Item</h1>

        {/* Read-only card context */}
        {cardInfo && (
          <div className="card-surface p-4 mb-6 bg-navy/30">
            <p className="text-sm font-medium">{cardInfo.person?.displayName || 'Unknown'}</p>
            <p className="text-xs text-silver">{cardInfo.set?.name} #{cardInfo.cardNumber} • {cardInfo.set?.year} • {cardInfo.team?.name}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card-surface p-6 space-y-4">
          {/* Quantity & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-silver block mb-1">Quantity *</label>
              <input type="number" min="1" className="input-field" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
            </div>
            <div>
              <label className="text-sm text-silver block mb-1">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="OWNED">Owned</option>
                <option value="FOR_SALE">For Sale</option>
                <option value="SOLD">Sold</option>
                <option value="TRADE_ONLY">Trade Only</option>
                <option value="WATCHLIST">Watchlist</option>
              </select>
            </div>
          </div>

          {/* Grading */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-silver block mb-1">Condition</label>
              <select className="input-field" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
                <option value="">Raw</option>
                <option value="RAW">RAW</option>
                <option value="PSA">PSA</option>
                <option value="BGS">BGS</option>
                <option value="SGC">SGC</option>
                <option value="CGC">CGC</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-silver block mb-1">Grade Company</label>
              <input className="input-field" value={form.gradeCompany} onChange={e => setForm({ ...form, gradeCompany: e.target.value })} placeholder="e.g. PSA" />
            </div>
            <div>
              <label className="text-sm text-silver block mb-1">Grade Value</label>
              <input className="input-field" value={form.gradeValue} onChange={e => setForm({ ...form, gradeValue: e.target.value })} placeholder="e.g. 9.5" />
            </div>
          </div>

          <div>
            <label className="text-sm text-silver block mb-1">Cert Number</label>
            <input className="input-field" value={form.certNumber} onChange={e => setForm({ ...form, certNumber: e.target.value })} />
          </div>

          {/* Financials */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-silver block mb-1">Purchase Price ($)</label>
              <input type="number" step="0.01" min="0" className="input-field" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-silver block mb-1">Estimated Value ($)</label>
              <input type="number" step="0.01" min="0" className="input-field" value={form.estimatedValue} onChange={e => setForm({ ...form, estimatedValue: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-silver block mb-1">Asking Price ($)</label>
              <input type="number" step="0.01" min="0" className="input-field" value={form.askingPrice} onChange={e => setForm({ ...form, askingPrice: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-sm text-silver block mb-1">Acquisition Date</label>
            <input type="date" className="input-field" value={form.acquisitionDate} onChange={e => setForm({ ...form, acquisitionDate: e.target.value })} />
          </div>

          <div>
            <label className="text-sm text-silver block mb-1">Storage Location</label>
            <input className="input-field" value={form.storageLocation} onChange={e => setForm({ ...form, storageLocation: e.target.value })} placeholder="e.g. Box A, Shelf 3, Safe" />
          </div>

          <div>
            <label className="text-sm text-silver block mb-1">Notes (private)</label>
            <textarea className="input-field min-h-[80px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          {/* Private Image URLs */}
          <div className="border-t border-silver/10 pt-4">
            <p className="text-sm text-silver mb-3">Private Scans / Images</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-silver block mb-1">Front Scan URL</label>
                <input className="input-field text-sm" value={form.frontScanUrl} onChange={e => setForm({ ...form, frontScanUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-silver block mb-1">Back Scan URL</label>
                <input className="input-field text-sm" value={form.backScanUrl} onChange={e => setForm({ ...form, backScanUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-silver block mb-1">Private Image URL</label>
                <input className="input-field text-sm" value={form.privateImageUrl} onChange={e => setForm({ ...form, privateImageUrl: e.target.value })} placeholder="https://..." />
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
            <Link href={`/inventory/${id}`} className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
