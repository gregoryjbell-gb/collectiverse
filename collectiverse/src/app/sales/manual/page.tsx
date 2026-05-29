'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PLATFORMS = ['eBay', 'COMC', 'Facebook', 'Whatnot', 'Mercari', 'Local Sale', 'Trade Night', 'Other'];

export default function ManualSalePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    inventoryItemId: '',
    inventoryGroupId: '',
    itemType: 'ITEM' as 'ITEM' | 'GROUP',
    externalPlatform: 'eBay',
    externalOrderId: '',
    externalBuyerName: '',
    salePrice: '',
    shippingPrice: '',
    externalShippingName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    carrier: 'USPS',
    trackingNumber: '',
    trackingUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/sales/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/sales/${data.sale.id}`);
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to record sale');
      }
    } finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Record External Sale</h1>
          <Link href="/sales" className="text-sm text-silver hover:text-electric">All Sales</Link>
        </div>

        <p className="text-silver text-sm mb-6">Record a sale made on another platform (eBay, Facebook, local, etc.) to keep your inventory and records in sync.</p>

        <form onSubmit={handleSubmit} className="card-surface p-6 space-y-4">
          {/* Item selection */}
          <div>
            <label className="text-sm text-silver block mb-1">What did you sell?</label>
            <div className="flex gap-3 mb-2">
              <label className="flex items-center gap-2 text-sm text-silver cursor-pointer">
                <input type="radio" checked={form.itemType === 'ITEM'} onChange={() => setForm({...form, itemType: 'ITEM', inventoryGroupId: ''})} /> Single Item
              </label>
              <label className="flex items-center gap-2 text-sm text-silver cursor-pointer">
                <input type="radio" checked={form.itemType === 'GROUP'} onChange={() => setForm({...form, itemType: 'GROUP', inventoryItemId: ''})} /> Group / Lot
              </label>
            </div>
            {form.itemType === 'ITEM' ? (
              <input className="input-field text-sm" placeholder="Inventory Item ID" value={form.inventoryItemId} onChange={e => setForm({...form, inventoryItemId: e.target.value})} required />
            ) : (
              <input className="input-field text-sm" placeholder="Inventory Group ID" value={form.inventoryGroupId} onChange={e => setForm({...form, inventoryGroupId: e.target.value})} required />
            )}
          </div>

          {/* Platform details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-silver">Platform *</label>
              <select className="input-field text-sm" value={form.externalPlatform} onChange={e => setForm({...form, externalPlatform: e.target.value})}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-silver">Order ID</label><input className="input-field text-sm" value={form.externalOrderId} onChange={e => setForm({...form, externalOrderId: e.target.value})} /></div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-silver">Sale Price *</label><input type="number" step="0.01" className="input-field text-sm" value={form.salePrice} onChange={e => setForm({...form, salePrice: e.target.value})} required /></div>
            <div><label className="text-xs text-silver">Shipping Price</label><input type="number" step="0.01" className="input-field text-sm" value={form.shippingPrice} onChange={e => setForm({...form, shippingPrice: e.target.value})} /></div>
          </div>

          {/* Buyer info */}
          <div>
            <label className="text-xs text-silver">Buyer Name</label>
            <input className="input-field text-sm" value={form.externalBuyerName} onChange={e => setForm({...form, externalBuyerName: e.target.value})} />
          </div>

          {/* Shipping address */}
          <details className="border border-silver/10 rounded-lg p-3">
            <summary className="text-sm text-silver cursor-pointer">Shipping Address (optional)</summary>
            <div className="mt-3 space-y-2">
              <input className="input-field text-sm" placeholder="Recipient Name" value={form.externalShippingName} onChange={e => setForm({...form, externalShippingName: e.target.value})} />
              <input className="input-field text-sm" placeholder="Address Line 1" value={form.addressLine1} onChange={e => setForm({...form, addressLine1: e.target.value})} />
              <input className="input-field text-sm" placeholder="Address Line 2" value={form.addressLine2} onChange={e => setForm({...form, addressLine2: e.target.value})} />
              <div className="grid grid-cols-3 gap-2">
                <input className="input-field text-sm" placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                <input className="input-field text-sm" placeholder="State" value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
                <input className="input-field text-sm" placeholder="Zip" value={form.postalCode} onChange={e => setForm({...form, postalCode: e.target.value})} />
              </div>
              <input className="input-field text-sm" placeholder="Country" value={form.country} onChange={e => setForm({...form, country: e.target.value})} />
            </div>
          </details>

          {/* Tracking */}
          <details className="border border-silver/10 rounded-lg p-3">
            <summary className="text-sm text-silver cursor-pointer">Tracking Info (optional)</summary>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <select className="input-field text-sm" value={form.carrier} onChange={e => setForm({...form, carrier: e.target.value})}>
                <option value="USPS">USPS</option><option value="UPS">UPS</option><option value="FEDEX">FedEx</option><option value="DHL">DHL</option><option value="OTHER">Other</option>
              </select>
              <input className="input-field text-sm" placeholder="Tracking #" value={form.trackingNumber} onChange={e => setForm({...form, trackingNumber: e.target.value})} />
              <input className="input-field text-sm" placeholder="Tracking URL" value={form.trackingUrl} onChange={e => setForm({...form, trackingUrl: e.target.value})} />
            </div>
          </details>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Recording...' : 'Record Sale'}</button>
            <Link href="/sales" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </main>
  );
}
