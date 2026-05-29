'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

export default function AddListingPageWrapper() {
  return <Suspense fallback={<div className="min-h-screen py-12 px-6 text-silver text-center">Loading...</div>}><AddListingPage /></Suspense>;
}

function AddListingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preItemId = searchParams.get('itemId') || '';
  const preGroupId = searchParams.get('groupId') || '';

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    listingType: preGroupId ? 'GROUP' : 'ITEM',
    inventoryItemId: preItemId,
    inventoryGroupId: preGroupId,
    price: '',
    minimumOffer: '',
    allowOffers: false,
    allowTrades: false,
    buyNowEnabled: true,
    description: '',
    shippingNotes: '',
    status: 'ACTIVE',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/listings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      router.push('/listings');
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-lg mx-auto">
        <Link href="/listings" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back</Link>
        <h1 className="text-2xl font-bold mb-6">Create Listing</h1>
        <form onSubmit={handleSubmit} className="card-surface p-6 space-y-4">
          <div><label className="text-sm text-silver block mb-1">Listing Type</label>
            <select className="input-field" value={form.listingType} onChange={e => setForm({...form, listingType: e.target.value})}>
              <option value="ITEM">Single Item</option>
              <option value="GROUP">Group / Lot / Set</option>
            </select>
          </div>
          {form.listingType === 'ITEM' && (
            <div><label className="text-sm text-silver block mb-1">Inventory Item ID</label>
              <input className="input-field" value={form.inventoryItemId} onChange={e => setForm({...form, inventoryItemId: e.target.value})} placeholder="Paste inventory item ID" required />
            </div>
          )}
          {form.listingType === 'GROUP' && (
            <div><label className="text-sm text-silver block mb-1">Inventory Group ID</label>
              <input className="input-field" value={form.inventoryGroupId} onChange={e => setForm({...form, inventoryGroupId: e.target.value})} placeholder="Paste group ID" required />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-silver block mb-1">Price ($)</label><input type="number" step="0.01" className="input-field" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
            <div><label className="text-sm text-silver block mb-1">Min Offer ($)</label><input type="number" step="0.01" className="input-field" value={form.minimumOffer} onChange={e => setForm({...form, minimumOffer: e.target.value})} /></div>
          </div>
          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-silver cursor-pointer"><input type="checkbox" checked={form.buyNowEnabled} onChange={e => setForm({...form, buyNowEnabled: e.target.checked})} /> Enable Buy Now</label>
            <label className="flex items-center gap-2 text-sm text-silver cursor-pointer"><input type="checkbox" checked={form.allowOffers} onChange={e => setForm({...form, allowOffers: e.target.checked})} /> Allow Offers</label>
            <label className="flex items-center gap-2 text-sm text-silver cursor-pointer"><input type="checkbox" checked={form.allowTrades} onChange={e => setForm({...form, allowTrades: e.target.checked})} /> Allow Trades</label>
          </div>
          <div><label className="text-sm text-silver block mb-1">Description</label><textarea className="input-field min-h-[80px]" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div><label className="text-sm text-silver block mb-1">Shipping Notes</label><textarea className="input-field min-h-[50px]" value={form.shippingNotes} onChange={e => setForm({...form, shippingNotes: e.target.value})} /></div>
          <div><label className="text-sm text-silver block mb-1">Status</label>
            <select className="input-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3"><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Listing'}</button><Link href="/listings" className="btn-secondary">Cancel</Link></div>
        </form>
      </div>
    </main>
  );
}
