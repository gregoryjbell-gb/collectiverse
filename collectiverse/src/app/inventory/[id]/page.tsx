'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const TX_TYPES = ['PURCHASE', 'SALE', 'TRADE', 'GRADE_SUBMISSION', 'GRADE_RETURN', 'VALUE_UPDATE', 'TRANSFER', 'NOTE'];

export default function InventoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTxForm, setShowTxForm] = useState(false);
  const [txForm, setTxForm] = useState({ type: 'PURCHASE', amount: '', marketplace: '', counterparty: '', transactionDate: '', notes: '', gradeCompany: '', gradeValue: '', markAsSold: true });
  const [editingTx, setEditingTx] = useState<string | null>(null);
  const [editTxForm, setEditTxForm] = useState<any>({});
  const [txSaving, setTxSaving] = useState(false);

  const loadItem = () => {
    fetch(`/api/inventory/${id}`)
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } if (!r.ok) { router.push('/inventory'); return null; } return r.json(); })
      .then(d => { if (d) setItem(d.item); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadItem(); }, [id]);

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxSaving(true);
    const res = await fetch(`/api/inventory/${id}/transactions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(txForm),
    });
    if (res.ok) { setShowTxForm(false); setTxForm({ type: 'PURCHASE', amount: '', marketplace: '', counterparty: '', transactionDate: '', notes: '', gradeCompany: '', gradeValue: '', markAsSold: true }); loadItem(); }
    setTxSaving(false);
  };

  const saveEditTx = async (txId: string) => {
    await fetch(`/api/transactions/${txId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editTxForm) });
    setEditingTx(null);
    loadItem();
  };

  const deleteTx = async (txId: string) => {
    if (!confirm('Delete this transaction?')) return;
    await fetch(`/api/transactions/${txId}`, { method: 'DELETE' });
    loadItem();
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!item) return null;

  const card = item.card;
  const txs = item.transactions || [];

  // Analytics
  const purchases = txs.filter((t: any) => t.type === 'PURCHASE');
  const sales = txs.filter((t: any) => t.type === 'SALE');
  const totalInvested = purchases.reduce((s: number, t: any) => s + (t.amount || 0), 0);
  const totalSold = sales.reduce((s: number, t: any) => s + (t.amount || 0), 0);
  const realizedGL = totalSold - (sales.length > 0 ? totalInvested * (sales.length / Math.max(purchases.length, 1)) : 0);
  const unrealizedGL = (item.estimatedValue || 0) - (item.purchasePrice || 0);
  const roi = (item.purchasePrice && item.purchasePrice > 0) ? (((item.estimatedValue || 0) - item.purchasePrice) / item.purchasePrice * 100) : 0;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/inventory" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back to Inventory</Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Card info */}
          <div>
            <div className="card-surface p-6">
              <h2 className="text-sm text-silver uppercase tracking-wide mb-2">Public Card</h2>
              <h1 className="text-2xl font-bold mb-1">{card.person?.displayName || 'Unknown'}</h1>
              <p className="text-silver">{card.set?.name} #{card.cardNumber} {card.year && `(${card.year})`}</p>
              {card.team && <p className="text-silver text-sm">{card.team.name}</p>}
              <Link href={`/cards/${card.id}`} className="text-electric text-sm hover:underline mt-3 inline-block">View public card page &rarr;</Link>
            </div>

            {(item.frontScanUrl || item.backScanUrl || item.privateImageUrl) && (
              <div className="card-surface p-6 mt-4">
                <h3 className="font-semibold mb-3">Private Scans</h3>
                <div className="grid grid-cols-2 gap-3">
                  {item.frontScanUrl && <img src={item.frontScanUrl} alt="Front scan" className="rounded-lg" />}
                  {item.backScanUrl && <img src={item.backScanUrl} alt="Back scan" className="rounded-lg" />}
                  {item.privateImageUrl && <img src={item.privateImageUrl} alt="Private image" className="rounded-lg col-span-2" />}
                </div>
              </div>
            )}

            {/* Analytics */}
            <div className="card-surface p-6 mt-4">
              <h3 className="font-semibold mb-3">Analytics</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <dt className="text-silver">Total Invested</dt><dd className="font-bold">${totalInvested.toLocaleString()}</dd>
                <dt className="text-silver">Total Sold</dt><dd className="font-bold">${totalSold.toLocaleString()}</dd>
                <dt className="text-silver">Realized G/L</dt><dd className={`font-bold ${realizedGL >= 0 ? 'text-green-400' : 'text-red-400'}`}>{realizedGL >= 0 ? '+' : ''}${realizedGL.toLocaleString()}</dd>
                <dt className="text-silver">Unrealized G/L</dt><dd className={`font-bold ${unrealizedGL >= 0 ? 'text-green-400' : 'text-red-400'}`}>{unrealizedGL >= 0 ? '+' : ''}${unrealizedGL.toLocaleString()}</dd>
                <dt className="text-silver">ROI</dt><dd className={`font-bold ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>{roi.toFixed(1)}%</dd>
                <dt className="text-silver">Avg. Cost</dt><dd className="font-bold">${purchases.length > 0 ? (totalInvested / purchases.length).toFixed(2) : '0'}</dd>
              </dl>
            </div>
          </div>

          {/* Right: Details */}
          <div className="space-y-4">
            <div className="card-surface p-6">
              <h3 className="font-semibold mb-4">My Copy Details</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <dt className="text-silver">Status</dt><dd><span className={`badge ${item.status === 'FOR_SALE' ? 'bg-green-500/20 text-green-400' : item.status === 'SOLD' ? 'bg-red-500/20 text-red-400' : 'bg-silver/10 text-silver'}`}>{item.status}</span></dd>
                <dt className="text-silver">Quantity</dt><dd>{item.quantity}</dd>
                <dt className="text-silver">Condition</dt><dd>{item.condition || 'Raw'}</dd>
                {item.gradeCompany && <><dt className="text-silver">Grading Co.</dt><dd>{item.gradeCompany}</dd></>}
                {item.gradeValue && <><dt className="text-silver">Grade</dt><dd className="text-electric font-bold">{item.gradeValue}</dd></>}
                {item.certNumber && <><dt className="text-silver">Cert #</dt><dd>{item.certNumber}</dd></>}
                {item.purchasePrice != null && <><dt className="text-silver">Purchase Price</dt><dd>${item.purchasePrice.toLocaleString()}</dd></>}
                {item.estimatedValue != null && <><dt className="text-silver">Estimated Value</dt><dd className="text-electric font-bold">${item.estimatedValue.toLocaleString()}</dd></>}
                {item.askingPrice != null && <><dt className="text-silver">Asking Price</dt><dd>${item.askingPrice.toLocaleString()}</dd></>}
                {item.acquisitionDate && <><dt className="text-silver">Acquired</dt><dd>{new Date(item.acquisitionDate).toLocaleDateString()}</dd></>}
                {item.storageLocation && <><dt className="text-silver">Location</dt><dd>{item.storageLocation}</dd></>}
              </dl>
              {item.notes && <div className="mt-3 pt-3 border-t border-silver/10"><p className="text-xs text-silver">{item.notes}</p></div>}
            </div>

            <div className="flex gap-3">
              <Link href={`/inventory/${item.id}/edit`} className="btn-primary text-sm">Edit</Link>
              <button onClick={() => { if (confirm('Delete?')) { fetch(`/api/inventory/${item.id}`, { method: 'DELETE' }).then(() => router.push('/inventory')); } }} className="btn-danger text-sm">Delete</button>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <section className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Transaction History</h2>
            <button onClick={() => setShowTxForm(!showTxForm)} className="btn-primary text-sm">{showTxForm ? 'Cancel' : '+ Add Transaction'}</button>
          </div>

          {showTxForm && (
            <form onSubmit={addTransaction} className="card-surface p-5 mb-6 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <select className="input-field text-sm" value={txForm.type} onChange={e => setTxForm({...txForm, type: e.target.value})}>
                  {TX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="number" step="0.01" className="input-field text-sm" placeholder="Amount ($)" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} />
                <input type="date" className="input-field text-sm" value={txForm.transactionDate} onChange={e => setTxForm({...txForm, transactionDate: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field text-sm" placeholder="Marketplace (eBay, COMC, etc.)" value={txForm.marketplace} onChange={e => setTxForm({...txForm, marketplace: e.target.value})} />
                <input className="input-field text-sm" placeholder="Counterparty" value={txForm.counterparty} onChange={e => setTxForm({...txForm, counterparty: e.target.value})} />
              </div>
              {txForm.type === 'GRADE_RETURN' && (
                <div className="grid grid-cols-2 gap-3">
                  <input className="input-field text-sm" placeholder="Grade Company (PSA, BGS...)" value={txForm.gradeCompany} onChange={e => setTxForm({...txForm, gradeCompany: e.target.value})} />
                  <input className="input-field text-sm" placeholder="Grade Value (e.g. 9.5)" value={txForm.gradeValue} onChange={e => setTxForm({...txForm, gradeValue: e.target.value})} />
                </div>
              )}
              {txForm.type === 'SALE' && (
                <label className="flex items-center gap-2 text-sm text-silver cursor-pointer">
                  <input type="checkbox" checked={txForm.markAsSold} onChange={e => setTxForm({...txForm, markAsSold: e.target.checked})} /> Mark item as SOLD
                </label>
              )}
              <textarea className="input-field text-sm min-h-[50px] w-full" placeholder="Notes" value={txForm.notes} onChange={e => setTxForm({...txForm, notes: e.target.value})} />
              <button type="submit" disabled={txSaving} className="btn-primary text-sm">{txSaving ? 'Saving...' : 'Add Transaction'}</button>
            </form>
          )}

          {txs.length === 0 ? (
            <p className="text-silver text-sm">No transactions recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {txs.map((tx: any) => (
                editingTx === tx.id ? (
                  <div key={tx.id} className="card-surface p-4 space-y-2 border-electric/30 border">
                    <div className="grid grid-cols-3 gap-2">
                      <select className="input-field text-xs" value={editTxForm.type} onChange={e => setEditTxForm({...editTxForm, type: e.target.value})}>
                        {TX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input type="number" step="0.01" className="input-field text-xs" placeholder="Amount" value={editTxForm.amount || ''} onChange={e => setEditTxForm({...editTxForm, amount: e.target.value})} />
                      <input type="date" className="input-field text-xs" value={editTxForm.transactionDate || ''} onChange={e => setEditTxForm({...editTxForm, transactionDate: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input-field text-xs" placeholder="Marketplace" value={editTxForm.marketplace || ''} onChange={e => setEditTxForm({...editTxForm, marketplace: e.target.value})} />
                      <input className="input-field text-xs" placeholder="Counterparty" value={editTxForm.counterparty || ''} onChange={e => setEditTxForm({...editTxForm, counterparty: e.target.value})} />
                    </div>
                    <textarea className="input-field text-xs min-h-[40px] w-full" placeholder="Notes" value={editTxForm.notes || ''} onChange={e => setEditTxForm({...editTxForm, notes: e.target.value})} />
                    <div className="flex gap-2">
                      <button onClick={() => saveEditTx(tx.id)} className="text-green-400 text-xs hover:underline">Save</button>
                      <button onClick={() => setEditingTx(null)} className="text-silver text-xs hover:underline">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div key={tx.id} className="card-surface p-4 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge text-xs ${tx.type === 'PURCHASE' ? 'bg-green-500/20 text-green-400' : tx.type === 'SALE' ? 'bg-red-500/20 text-red-400' : tx.type === 'VALUE_UPDATE' ? 'bg-electric/20 text-electric' : 'bg-silver/10 text-silver'}`}>{tx.type}</span>
                        {tx.amount && <span className="text-sm font-bold text-electric">${tx.amount.toLocaleString()}</span>}
                      </div>
                      <div className="text-xs text-silver space-x-3">
                        {tx.transactionDate && <span>{new Date(tx.transactionDate).toLocaleDateString()}</span>}
                        {tx.marketplace && <span>{tx.marketplace}</span>}
                        {tx.counterparty && <span>w/ {tx.counterparty}</span>}
                      </div>
                      {tx.notes && <p className="text-xs text-silver/70 mt-1">{tx.notes}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { setEditingTx(tx.id); setEditTxForm({ type: tx.type, amount: tx.amount || '', marketplace: tx.marketplace || '', counterparty: tx.counterparty || '', transactionDate: tx.transactionDate ? tx.transactionDate.split('T')[0] : '', notes: tx.notes || '' }); }} className="text-electric text-xs hover:underline">Edit</button>
                      <button onClick={() => deleteTx(tx.id)} className="text-red-400 text-xs hover:underline">Del</button>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
