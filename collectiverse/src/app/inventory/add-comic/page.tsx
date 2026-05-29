'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddComicPage() {
  const router = useRouter();
  const [step, setStep] = useState<'search' | 'create' | 'inventory'>('search');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [invForm, setInvForm] = useState({ condition: 'RAW', gradeCompany: '', gradeValue: '', certNumber: '', purchasePrice: '', estimatedValue: '', notes: '', storageLocation: '' });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/comics?q=${encodeURIComponent(search)}`);
    const data = await res.json();
    setResults(data.issues || []);
  };

  const handleSelect = (issue: any) => {
    setSelectedIssue(issue);
    setStep('inventory');
  };

  const handleAddToInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Find or use the collectible linked to this issue
    const collectibleId = selectedIssue.collectibleId;
    const res = await fetch('/api/inventory', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: selectedIssue.id, // temporary — uses comicIssueId field
        collectibleId,
        collectibleType: 'COMIC_BOOK',
        ...invForm,
        purchasePrice: invForm.purchasePrice ? parseFloat(invForm.purchasePrice) : null,
        estimatedValue: invForm.estimatedValue ? parseFloat(invForm.estimatedValue) : null,
      }),
    });
    if (res.ok) router.push('/inventory');
    else alert('Failed to add');
    setSaving(false);
  };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/inventory/add/select-type" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back</Link>
        <h1 className="text-2xl font-bold mb-6">Add Comic to Inventory</h1>

        {step === 'search' && (
          <div className="card-surface p-6 space-y-4">
            <form onSubmit={handleSearch} className="flex gap-3">
              <input className="input-field flex-1" placeholder="Search by series, issue, writer..." value={search} onChange={e => setSearch(e.target.value)} />
              <button type="submit" className="btn-primary text-sm">Search</button>
            </form>
            {results.length > 0 && (
              <div className="space-y-2">
                {results.map((issue: any) => (
                  <button key={issue.id} onClick={() => handleSelect(issue)} className="card-surface p-3 w-full text-left hover:border-electric/30 transition-colors">
                    <p className="font-medium text-sm">{issue.comicSeries?.title || ''} #{issue.issueNumber}</p>
                    <p className="text-xs text-silver">{issue.comicSeries?.publisher || issue.publisher}{issue.writer ? ` • ${issue.writer}` : ''}</p>
                  </button>
                ))}
              </div>
            )}
            {results.length === 0 && search && <p className="text-silver text-sm">No results. <button onClick={() => setStep('create')} className="text-electric hover:underline">Create new comic issue</button></p>}
          </div>
        )}

        {step === 'inventory' && selectedIssue && (
          <form onSubmit={handleAddToInventory} className="card-surface p-6 space-y-4">
            <div className="bg-gunmetal/30 rounded-lg p-3 mb-4">
              <p className="font-medium text-sm">{selectedIssue.comicSeries?.title || ''} #{selectedIssue.issueNumber}</p>
              <p className="text-xs text-silver">{selectedIssue.writer || ''}{selectedIssue.artist ? ` / ${selectedIssue.artist}` : ''}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-silver">Condition</label>
                <select className="input-field text-sm" value={invForm.condition} onChange={e => setInvForm({...invForm, condition: e.target.value})}>
                  <option value="RAW">Raw</option><option value="CGC">CGC</option><option value="CBCS">CBCS</option><option value="PGX">PGX</option>
                </select>
              </div>
              <div><label className="text-xs text-silver">Grade</label><input className="input-field text-sm" placeholder="9.8" value={invForm.gradeValue} onChange={e => setInvForm({...invForm, gradeValue: e.target.value})} /></div>
              <div><label className="text-xs text-silver">Cert #</label><input className="input-field text-sm" value={invForm.certNumber} onChange={e => setInvForm({...invForm, certNumber: e.target.value})} /></div>
              <div><label className="text-xs text-silver">Purchase Price</label><input type="number" step="0.01" className="input-field text-sm" value={invForm.purchasePrice} onChange={e => setInvForm({...invForm, purchasePrice: e.target.value})} /></div>
              <div><label className="text-xs text-silver">Estimated Value</label><input type="number" step="0.01" className="input-field text-sm" value={invForm.estimatedValue} onChange={e => setInvForm({...invForm, estimatedValue: e.target.value})} /></div>
              <div><label className="text-xs text-silver">Storage</label><input className="input-field text-sm" value={invForm.storageLocation} onChange={e => setInvForm({...invForm, storageLocation: e.target.value})} /></div>
            </div>
            <div><label className="text-xs text-silver">Notes</label><textarea className="input-field text-sm min-h-[50px]" value={invForm.notes} onChange={e => setInvForm({...invForm, notes: e.target.value})} /></div>
            <div className="flex gap-3">
              <button onClick={() => setStep('search')} type="button" className="btn-secondary text-sm">Back</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Adding...' : 'Add to Inventory'}</button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
