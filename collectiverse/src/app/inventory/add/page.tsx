'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
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

  const [options, setOptions] = useState<{ players: any[]; sets: any[]; teams: any[] }>({ players: [], sets: [], teams: [] });
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [playerFilter, setPlayerFilter] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
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

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [privateFile, setPrivateFile] = useState<File | null>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const privateRef = useRef<HTMLInputElement>(null);

  // Load dropdown options
  useEffect(() => {
    fetch('/api/inventory/options')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setOptions(d); })
      .catch(() => {});
  }, [router]);

  // Load cards when player or set filter changes
  useEffect(() => {
    if (!playerFilter && !setFilter) { setCards([]); return; }
    const params = new URLSearchParams();
    if (playerFilter) params.set('q', options.players.find(p => p.id === playerFilter)?.displayName || '');
    fetch(`/api/search?${params}`)
      .then(r => r.json())
      .then(d => {
        const cardResults = (d.results || []).filter((r: any) => r.type === 'card');
        setCards(cardResults);
      })
      .catch(() => {});
  }, [playerFilter, setFilter]);

  // If preselected card, load it
  useEffect(() => {
    if (preselectedCardId) {
      fetch(`/api/search?q=${preselectedCardId}`)
        .then(r => r.json())
        .then(d => {
          const card = (d.results || []).find((r: any) => r.type === 'card' && r.id === preselectedCardId);
          if (card) setSelectedCard(card);
        })
        .catch(() => {});
    }
  }, [preselectedCardId]);

  // Load filtered cards from admin cards API (better for full list)
  useEffect(() => {
    if (!playerFilter && !setFilter) { setCards([]); return; }
    // Use the search with player name
    const playerName = options.players.find(p => p.id === playerFilter)?.displayName;
    if (playerName) {
      fetch(`/api/search?q=${encodeURIComponent(playerName)}`)
        .then(r => r.json())
        .then(d => setCards((d.results || []).filter((r: any) => r.type === 'card')))
        .catch(() => {});
    }
  }, [playerFilter, options.players]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) { setError('Please select a card from the database'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cardId: selectedCard.id }),
      });
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }

      const { item } = await res.json();

      // Upload images if selected
      if (frontFile || backFile || privateFile) {
        const fd = new FormData();
        if (frontFile) fd.append('frontScan', frontFile);
        if (backFile) fd.append('backScan', backFile);
        if (privateFile) fd.append('privateImage', privateFile);
        await fetch(`/api/inventory/${item.id}/upload`, { method: 'POST', body: fd });
      }

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
          <div className="border-b border-silver/10 pb-4">
            <p className="text-sm font-medium mb-3">Select Card from Database *</p>

            {selectedCard ? (
              <div className="flex items-center justify-between bg-navy/50 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{selectedCard.label}</p>
                  {selectedCard.sublabel && <p className="text-xs text-silver">{selectedCard.sublabel}</p>}
                </div>
                <button type="button" onClick={() => setSelectedCard(null)} className="text-red-400 text-xs hover:underline">Change</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-silver block mb-1">Filter by Player *</label>
                  <select className="input-field" value={playerFilter} onChange={e => setPlayerFilter(e.target.value)}>
                    <option value="">Select a player...</option>
                    {options.players.map(p => (
                      <option key={p.id} value={p.id}>{p.displayName}</option>
                    ))}
                  </select>
                </div>

                {playerFilter && cards.length > 0 && (
                  <div>
                    <label className="text-xs text-silver block mb-1">Select Card</label>
                    <div className="max-h-48 overflow-y-auto border border-silver/20 rounded-lg">
                      {cards.map((c: any) => (
                        <button key={c.id} type="button" onClick={() => setSelectedCard(c)}
                          className="w-full text-left px-4 py-2.5 hover:bg-navy/50 border-b border-silver/10 last:border-0 transition-colors">
                          <p className="text-sm text-white">{c.label}</p>
                          {c.sublabel && <p className="text-xs text-silver">{c.sublabel}</p>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {playerFilter && cards.length === 0 && (
                  <p className="text-xs text-silver">No cards found for this player. The card must exist in the public database first.</p>
                )}

                {!playerFilter && (
                  <p className="text-xs text-silver">Select a player to see their available cards.</p>
                )}
              </div>
            )}
          </div>

          {/* Inventory Details */}
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

          {/* Image Uploads */}
          <div className="border-t border-silver/10 pt-4">
            <p className="text-sm font-medium mb-2">Private Scans (optional)</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <input ref={frontRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => setFrontFile(e.target.files?.[0] || null)} />
                <button type="button" onClick={() => frontRef.current?.click()} className={`w-full text-xs py-3 px-2 rounded-lg border transition-colors ${frontFile ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-silver/20 text-silver hover:border-silver/40'}`}>
                  {frontFile ? `✓ ${frontFile.name.slice(0, 15)}...` : '+ Front Scan'}
                </button>
              </div>
              <div>
                <input ref={backRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => setBackFile(e.target.files?.[0] || null)} />
                <button type="button" onClick={() => backRef.current?.click()} className={`w-full text-xs py-3 px-2 rounded-lg border transition-colors ${backFile ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-silver/20 text-silver hover:border-silver/40'}`}>
                  {backFile ? `✓ ${backFile.name.slice(0, 15)}...` : '+ Back Scan'}
                </button>
              </div>
              <div>
                <input ref={privateRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => setPrivateFile(e.target.files?.[0] || null)} />
                <button type="button" onClick={() => privateRef.current?.click()} className={`w-full text-xs py-3 px-2 rounded-lg border transition-colors ${privateFile ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-silver/20 text-silver hover:border-silver/40'}`}>
                  {privateFile ? `✓ ${privateFile.name.slice(0, 15)}...` : '+ Private Image'}
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || !selectedCard} className="btn-primary disabled:opacity-50">{saving ? 'Adding...' : 'Add to Inventory'}</button>
            <Link href="/inventory" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
