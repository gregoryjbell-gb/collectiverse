'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function InventoryAddPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-12 px-6 text-silver text-center">Loading...</div>}>
      <InventoryAddForm />
    </Suspense>
  );
}

function InventoryAddForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCardId = searchParams.get('cardId');

  const [cards, setCards] = useState<any[]>([]);
  const [cardSearch, setCardSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    cardId: preselectedCardId || '',
    quantity: '1',
    condition: 'RAW',
    gradeCompany: '',
    gradeValue: '',
    certNumber: '',
    acquisitionDate: '',
    purchasePrice: '',
    estimatedValue: '',
    askingPrice: '',
    status: 'OWNED',
    storageLocation: '',
    notes: '',
  });

  useEffect(() => {
    if (preselectedCardId) {
      fetch(`/api/search?q=`).then(r => r.json()).catch(() => {});
    }
  }, [preselectedCardId]);

  useEffect(() => {
    if (cardSearch.length >= 2) {
      fetch(`/api/search?q=${encodeURIComponent(cardSearch)}`)
        .then(r => r.json())
        .then(d => setCards((d.results || []).filter((r: any) => r.type === 'card')))
        .catch(() => {});
    } else {
      setCards([]);
    }
  }, [cardSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cardId) { setError('Please select a card'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      router.push('/inventory');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/inventory" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back to Inventory</Link>
        <h1 className="text-2xl font-bold mb-6">Add to Inventory</h1>

        <form onSubmit={handleSubmit} className="card-surface p-6 space-y-4">
          {/* Card Selection */}
          <div>
            <label className="text-sm text-silver block mb-1">Card *</label>
            {selectedCard ? (
              <div className="flex items-center justify-between bg-navy/50 rounded-lg px-4 py-2">
                <span className="text-sm">{selectedCard.label} {selectedCard.sublabel && `— ${selectedCard.sublabel}`}</span>
                <button type="button" onClick={() => { setSelectedCard(null); setForm({...form, cardId: ''}); }} className="text-red-400 text-xs">Change</button>
              </div>
            ) : (
              <div className="relative">
                <input className="input-field" placeholder="Search for a card (player name, set, card #)..." value={cardSearch} onChange={e => setCardSearch(e.target.value)} />
                {cards.length > 0 && (
                  <div className="absolute top-full mt-1 w-full bg-gunmetal border border-silver/20 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                    {cards.map((c: any) => (
                      <button key={c.id} type="button" onClick={() => { setSelectedCard(c); setForm({...form, cardId: c.id}); setCards([]); setCardSearch(''); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-navy/50 border-b border-silver/10 last:border-0">
                        <p className="text-sm text-white">{c.label}</p>
                        {c.sublabel && <p className="text-xs text-silver">{c.sublabel}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-silver block mb-1">Quantity</label>
              <input type="number" min="1" className="input-field" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} />
            </div>
            <div>
              <label className="text-sm text-silver block mb-1">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="OWNED">Owned</option>
                <option value="FOR_SALE">For Sale</option>
                <option value="TRADE_ONLY">Trade Only</option>
                <option value="WATCHLIST">Watchlist</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-silver block mb-1">Condition</label>
              <select className="input-field" value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}>
                <option value="RAW">Raw</option>
                <option value="PSA">PSA</option>
                <option value="BGS">BGS</option>
                <option value="SGC">SGC</option>
                <option value="CGC">CGC</option>
              </select>
            </div>
            {form.condition !== 'RAW' && (
              <>
                <div>
                  <label className="text-sm text-silver block mb-1">Grade</label>
                  <input className="input-field" value={form.gradeValue} onChange={e => setForm({...form, gradeValue: e.target.value})} placeholder="e.g. 9.5" />
                </div>
                <div>
                  <label className="text-sm text-silver block mb-1">Cert #</label>
                  <input className="input-field" value={form.certNumber} onChange={e => setForm({...form, certNumber: e.target.value})} />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-silver block mb-1">Purchase Price ($)</label>
              <input type="number" step="0.01" className="input-field" value={form.purchasePrice} onChange={e => setForm({...form, purchasePrice: e.target.value})} />
            </div>
            <div>
              <label className="text-sm text-silver block mb-1">Estimated Value ($)</label>
              <input type="number" step="0.01" className="input-field" value={form.estimatedValue} onChange={e => setForm({...form, estimatedValue: e.target.value})} />
            </div>
            <div>
              <label className="text-sm text-silver block mb-1">Asking Price ($)</label>
              <input type="number" step="0.01" className="input-field" value={form.askingPrice} onChange={e => setForm({...form, askingPrice: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="text-sm text-silver block mb-1">Acquisition Date</label>
            <input type="date" className="input-field" value={form.acquisitionDate} onChange={e => setForm({...form, acquisitionDate: e.target.value})} />
          </div>

          <div>
            <label className="text-sm text-silver block mb-1">Storage Location</label>
            <input className="input-field" value={form.storageLocation} onChange={e => setForm({...form, storageLocation: e.target.value})} placeholder="e.g. Box A, Shelf 3, Safe" />
          </div>

          <div>
            <label className="text-sm text-silver block mb-1">Notes (private)</label>
            <textarea className="input-field min-h-[80px]" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Adding...' : 'Add to Inventory'}</button>
            <Link href="/inventory" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
