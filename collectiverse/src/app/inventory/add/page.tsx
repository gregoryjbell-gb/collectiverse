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

interface CardResult {
  cardId: string;
  playerName: string;
  setName: string;
  manufacturer: string;
  year: number | null;
  sport: string;
  teamName: string;
  cardNumber: string | null;
  rookie: boolean;
  autograph: boolean;
  relic: boolean;
  parallel: string | null;
  frontImageUrl: string | null;
}

function InventoryAddForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCardId = searchParams.get('cardId');

  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [results, setResults] = useState<CardResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanImageUrl, setScanImageUrl] = useState('');
  const scanRef = useRef<HTMLInputElement>(null);

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

  const [showCreateCard, setShowCreateCard] = useState(false);
  const [creatingCard, setCreatingCard] = useState(false);
  const [newCardForm, setNewCardForm] = useState({
    playerName: '', sportName: '', year: '', setName: '', manufacturer: '', cardNumber: '',
    teamName: '', parallel: '', rookie: false, autograph: false, relic: false,
    serialNumber: '', printRun: '', frontImageUrl: '', backImageUrl: '', whyItMatters: '',
  });

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCard(true);
    setError('');
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCardForm),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const data = await res.json();
      setSelectedCard(data.card);
      setShowCreateCard(false);
      setResults([]);
      setSearchQuery('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingCard(false);
    }
  };

  const handleScanUpload = async (file: File) => {
    setScanning(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/cards/identify', { method: 'POST', body: fd });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const { suggestion } = await res.json();

      // Store the image URL for later use as frontScan
      if (suggestion.imageUrl) setScanImageUrl(suggestion.imageUrl);

      // If AI returned suggestions, prefill search or create form
      if (suggestion.playerName) {
        setSearchQuery(suggestion.playerName);
        // Also prefill the create card form
        setNewCardForm({
          ...newCardForm,
          playerName: suggestion.playerName || '',
          sportName: suggestion.sportName || '',
          year: suggestion.year || '',
          setName: suggestion.setName || '',
          manufacturer: suggestion.manufacturer || '',
          cardNumber: suggestion.cardNumber || '',
          teamName: suggestion.teamName || '',
          parallel: suggestion.parallel || '',
          rookie: suggestion.rookie || false,
          frontImageUrl: suggestion.imageUrl || '',
        });
      }

      if (suggestion.message) {
        setError(suggestion.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  };

  // Auth check
  useEffect(() => {
    fetch('/api/me').then(r => { if (r.status === 401) router.push('/login'); });
  }, [router]);

  // Preselect card if cardId in URL
  useEffect(() => {
    if (preselectedCardId) {
      fetch(`/api/cards/search?q=`)
        .then(r => r.json())
        .then(d => {
          const card = (d.results || []).find((c: CardResult) => c.cardId === preselectedCardId);
          if (card) setSelectedCard(card);
        });
    }
  }, [preselectedCardId]);

  const doSearch = () => {
    if (!searchQuery && !sportFilter && !yearFilter) { setResults([]); return; }
    setSearching(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (sportFilter) params.set('sport', sportFilter);
    if (yearFilter) params.set('year', yearFilter);

    fetch(`/api/cards/search?${params}`)
      .then(r => r.json())
      .then(d => setResults(d.results || []))
      .catch(() => {})
      .finally(() => setSearching(false));
  };

  useEffect(() => {
    const timeout = setTimeout(doSearch, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery, sportFilter, yearFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) { setError('Please select a card'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cardId: selectedCard.cardId }),
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
      } else if (scanImageUrl) {
        // Use the scan image as frontScanUrl
        await fetch(`/api/inventory/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frontScanUrl: scanImageUrl }),
        });
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
      <div className="max-w-3xl mx-auto">
        <Link href="/inventory" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back to Inventory</Link>
        <h1 className="text-2xl font-bold mb-6">Add to Inventory</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Search & Selection */}
          <div className="card-surface p-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold">1. Select Card from Database</h2>
              <div>
                <input ref={scanRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleScanUpload(f); }} />
                <button type="button" onClick={() => scanRef.current?.click()} disabled={scanning} className="btn-secondary text-xs">
                  {scanning ? 'Scanning...' : '📷 Scan / Upload Card'}
                </button>
              </div>
            </div>

            {scanImageUrl && !selectedCard && (
              <div className="mb-3 flex items-center gap-3 bg-navy/50 rounded-lg p-2">
                <img src={scanImageUrl} alt="Scanned card" className="w-16 h-20 object-cover rounded" />
                <p className="text-xs text-silver">Image saved. Fill in details below or search to match an existing card.</p>
              </div>
            )}

            {selectedCard ? (
              <div className="flex items-center justify-between bg-navy/50 rounded-lg px-4 py-3 border border-electric/30">
                <div>
                  <p className="font-medium">{selectedCard.playerName}</p>
                  <p className="text-sm text-silver">{selectedCard.setName} #{selectedCard.cardNumber} • {selectedCard.year} • {selectedCard.teamName}</p>
                  <div className="flex gap-1.5 mt-1">
                    {selectedCard.rookie && <span className="badge bg-amber-500/20 text-amber-400 text-xs">RC</span>}
                    {selectedCard.autograph && <span className="badge bg-purple-500/20 text-purple-400 text-xs">Auto</span>}
                    {selectedCard.parallel && <span className="badge bg-electric/20 text-electric text-xs">{selectedCard.parallel}</span>}
                    {selectedCard.sport && <span className="badge bg-silver/10 text-silver text-xs">{selectedCard.sport}</span>}
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedCard(null)} className="text-red-400 text-sm hover:underline">Change</button>
              </div>
            ) : (
              <>
                <div className="flex gap-3 mb-3 flex-wrap">
                  <input type="search" className="input-field flex-1 min-w-[200px]" placeholder="Search player, set, team, card #..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <select className="input-field w-auto" value={sportFilter} onChange={e => setSportFilter(e.target.value)}>
                    <option value="">All Sports</option>
                    <option value="NFL">NFL</option>
                    <option value="NBA">NBA</option>
                    <option value="MLB">MLB</option>
                  </select>
                  <input type="number" className="input-field w-24" placeholder="Year" value={yearFilter} onChange={e => setYearFilter(e.target.value)} />
                </div>

                {searching && <p className="text-silver text-sm">Searching...</p>}

                {results.length > 0 && (
                  <div className="max-h-64 overflow-y-auto border border-silver/20 rounded-lg">
                    {results.map(c => (
                      <button key={c.cardId} type="button" onClick={() => { setSelectedCard(c); setResults([]); setSearchQuery(''); }}
                        className="w-full text-left px-4 py-3 hover:bg-navy/50 border-b border-silver/10 last:border-0 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium">{c.playerName}</p>
                            <p className="text-xs text-silver">{c.setName} #{c.cardNumber} • {c.year} • {c.teamName}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {c.rookie && <span className="badge bg-amber-500/20 text-amber-400 text-[10px]">RC</span>}
                            {c.autograph && <span className="badge bg-purple-500/20 text-purple-400 text-[10px]">Auto</span>}
                            {c.parallel && <span className="badge bg-electric/20 text-electric text-[10px]">{c.parallel}</span>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!searching && searchQuery && results.length === 0 && (
                  <div className="mt-3">
                    <p className="text-silver text-sm mb-2">No cards found matching your search.</p>
                    <button type="button" onClick={() => { setShowCreateCard(true); setNewCardForm({...newCardForm, playerName: searchQuery}); }} className="btn-primary text-sm">
                      + Create New Card
                    </button>
                  </div>
                )}

                {showCreateCard && (
                  <div className="mt-4 card-surface p-5 border border-amber-500/30 space-y-3">
                    <h3 className="font-semibold text-amber-400 text-sm">Create New Public Card</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <input className="input-field text-sm" placeholder="Player Name *" value={newCardForm.playerName} onChange={e => setNewCardForm({...newCardForm, playerName: e.target.value})} required />
                      <input className="input-field text-sm" placeholder="Sport * (e.g. NFL)" value={newCardForm.sportName} onChange={e => setNewCardForm({...newCardForm, sportName: e.target.value})} required />
                      <input type="number" className="input-field text-sm" placeholder="Year *" value={newCardForm.year} onChange={e => setNewCardForm({...newCardForm, year: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <input className="input-field text-sm" placeholder="Set Name *" value={newCardForm.setName} onChange={e => setNewCardForm({...newCardForm, setName: e.target.value})} required />
                      <input className="input-field text-sm" placeholder="Manufacturer" value={newCardForm.manufacturer} onChange={e => setNewCardForm({...newCardForm, manufacturer: e.target.value})} />
                      <input className="input-field text-sm" placeholder="Card # *" value={newCardForm.cardNumber} onChange={e => setNewCardForm({...newCardForm, cardNumber: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <input className="input-field text-sm" placeholder="Team (optional)" value={newCardForm.teamName} onChange={e => setNewCardForm({...newCardForm, teamName: e.target.value})} />
                      <input className="input-field text-sm" placeholder="Parallel (optional)" value={newCardForm.parallel} onChange={e => setNewCardForm({...newCardForm, parallel: e.target.value})} />
                      <input className="input-field text-sm" placeholder="Serial # (optional)" value={newCardForm.serialNumber} onChange={e => setNewCardForm({...newCardForm, serialNumber: e.target.value})} />
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-1.5 text-sm text-silver cursor-pointer">
                        <input type="checkbox" checked={newCardForm.rookie} onChange={e => setNewCardForm({...newCardForm, rookie: e.target.checked})} /> Rookie
                      </label>
                      <label className="flex items-center gap-1.5 text-sm text-silver cursor-pointer">
                        <input type="checkbox" checked={newCardForm.autograph} onChange={e => setNewCardForm({...newCardForm, autograph: e.target.checked})} /> Autograph
                      </label>
                      <label className="flex items-center gap-1.5 text-sm text-silver cursor-pointer">
                        <input type="checkbox" checked={newCardForm.relic} onChange={e => setNewCardForm({...newCardForm, relic: e.target.checked})} /> Relic
                      </label>
                    </div>
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                    <div className="flex gap-2">
                      <button type="button" onClick={handleCreateCard} disabled={creatingCard} className="btn-primary text-sm">{creatingCard ? 'Creating...' : 'Create Card'}</button>
                      <button type="button" onClick={() => setShowCreateCard(false)} className="btn-secondary text-sm">Cancel</button>
                    </div>
                    <p className="text-xs text-silver">This creates a public card record. Existing players, sports, teams, and sets will be reused if they match.</p>
                  </div>
                )}

                {!searchQuery && !sportFilter && !yearFilter && (
                  <p className="text-silver text-sm">Search for a card to add to your inventory.</p>
                )}
              </>
            )}
          </div>

          {/* Inventory Details */}
          {selectedCard && (
            <div className="card-surface p-6">
              <h2 className="font-semibold mb-3">2. Your Copy Details</h2>

              <div className="space-y-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-silver block mb-1">Acquisition Date</label>
                    <input type="date" className="input-field" value={form.acquisitionDate} onChange={e => setForm({...form, acquisitionDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm text-silver block mb-1">Storage Location</label>
                    <input className="input-field" value={form.storageLocation} onChange={e => setForm({...form, storageLocation: e.target.value})} placeholder="e.g. Box A, Shelf 3" />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-silver block mb-1">Notes (private)</label>
                  <textarea className="input-field min-h-[60px]" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                </div>

                {/* Image Uploads */}
                <div className="border-t border-silver/10 pt-4">
                  <p className="text-sm text-silver mb-2">Private Scans (optional)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <input ref={frontRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => setFrontFile(e.target.files?.[0] || null)} />
                      <button type="button" onClick={() => frontRef.current?.click()} className={`w-full text-xs py-3 px-2 rounded-lg border transition-colors ${frontFile ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-silver/20 text-silver hover:border-silver/40'}`}>
                        {frontFile ? '✓ Front Scan' : '+ Front Scan'}
                      </button>
                    </div>
                    <div>
                      <input ref={backRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => setBackFile(e.target.files?.[0] || null)} />
                      <button type="button" onClick={() => backRef.current?.click()} className={`w-full text-xs py-3 px-2 rounded-lg border transition-colors ${backFile ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-silver/20 text-silver hover:border-silver/40'}`}>
                        {backFile ? '✓ Back Scan' : '+ Back Scan'}
                      </button>
                    </div>
                    <div>
                      <input ref={privateRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => setPrivateFile(e.target.files?.[0] || null)} />
                      <button type="button" onClick={() => privateRef.current?.click()} className={`w-full text-xs py-3 px-2 rounded-lg border transition-colors ${privateFile ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-silver/20 text-silver hover:border-silver/40'}`}>
                        {privateFile ? '✓ Private Image' : '+ Private Image'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving || !selectedCard} className="btn-primary disabled:opacity-50">{saving ? 'Adding...' : 'Add to Inventory'}</button>
            <Link href="/inventory" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
