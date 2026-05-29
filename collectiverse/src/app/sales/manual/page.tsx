'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PLATFORMS = ['eBay', 'COMC', 'Facebook Marketplace', 'Whatnot', 'Mercari', 'Card Show', 'Private Sale', 'Local Sale', 'Other'];

export default function ManualSalePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    inventoryItemId: '',
    inventoryGroupId: '',
    itemType: 'ITEM' as 'ITEM' | 'GROUP',
    externalPlatform: 'eBay',
    externalOrderId: '',
    externalBuyerName: '',
    externalBuyerContact: '',
    externalSaleDate: new Date().toISOString().split('T')[0],
    externalNotes: '',
    salePrice: '',
    shippingPrice: '',
    platformFees: '',
    paymentStatus: 'PAID',
    externalShippingName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    carrier: '',
    trackingNumber: '',
    trackingUrl: '',
    shippedDate: '',
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

  const canAdvance = (s: number) => {
    if (s === 1) return form.itemType === 'ITEM' ? !!form.inventoryItemId : !!form.inventoryGroupId;
    if (s === 2) return !!form.externalPlatform && !!form.salePrice && !!form.externalSaleDate;
    return true;
  };

  const netProceeds = () => {
    const sale = parseFloat(form.salePrice) || 0;
    const fees = parseFloat(form.platformFees) || 0;
    return (sale - fees).toFixed(2);
  };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Record External Sale</h1>
          <Link href="/sales" className="text-sm text-silver hover:text-electric">All Sales</Link>
        </div>

        <p className="text-silver text-sm mb-6">Log a sale from eBay, COMC, Facebook, card shows, or private deals to keep your inventory and profit/loss records accurate.</p>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => setStep(s)}
                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${step >= s ? 'bg-electric text-white' : 'bg-gunmetal/50 text-silver'}`}
              >
                {s}
              </button>
              {s < 4 && <div className={`w-8 h-0.5 ${step > s ? 'bg-electric' : 'bg-silver/20'}`} />}
            </div>
          ))}
          <span className="text-xs text-silver ml-2">
            {step === 1 && 'Select Item'}
            {step === 2 && 'Sale Details'}
            {step === 3 && 'Shipping'}
            {step === 4 && 'Review'}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Select item */}
          {step === 1 && (
            <div className="card-surface p-6 space-y-4">
              <h2 className="font-semibold">What did you sell?</h2>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-silver cursor-pointer">
                  <input type="radio" checked={form.itemType === 'ITEM'} onChange={() => setForm({...form, itemType: 'ITEM', inventoryGroupId: ''})} /> Single Item
                </label>
                <label className="flex items-center gap-2 text-sm text-silver cursor-pointer">
                  <input type="radio" checked={form.itemType === 'GROUP'} onChange={() => setForm({...form, itemType: 'GROUP', inventoryItemId: ''})} /> Group / Lot
                </label>
              </div>
              {form.itemType === 'ITEM' ? (
                <div>
                  <label className="text-xs text-silver block mb-1">Inventory Item ID *</label>
                  <input className="input-field" placeholder="Paste from inventory detail page" value={form.inventoryItemId} onChange={e => setForm({...form, inventoryItemId: e.target.value})} required />
                  <p className="text-xs text-silver mt-1">Find this on your inventory item detail page URL.</p>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-silver block mb-1">Inventory Group ID *</label>
                  <input className="input-field" placeholder="Paste from group detail page" value={form.inventoryGroupId} onChange={e => setForm({...form, inventoryGroupId: e.target.value})} required />
                </div>
              )}
              <div className="flex justify-end">
                <button type="button" onClick={() => setStep(2)} disabled={!canAdvance(1)} className="btn-primary text-sm">Next: Sale Details</button>
              </div>
            </div>
          )}

          {/* Step 2: Sale details */}
          {step === 2 && (
            <div className="card-surface p-6 space-y-4">
              <h2 className="font-semibold">Sale Details</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-silver">Platform *</label>
                  <select className="input-field text-sm" value={form.externalPlatform} onChange={e => setForm({...form, externalPlatform: e.target.value})} required>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-silver">Sale Date *</label>
                  <input type="date" className="input-field text-sm" value={form.externalSaleDate} onChange={e => setForm({...form, externalSaleDate: e.target.value})} required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-silver">Sale Price * ($)</label><input type="number" step="0.01" min="0" className="input-field text-sm" value={form.salePrice} onChange={e => setForm({...form, salePrice: e.target.value})} required /></div>
                <div><label className="text-xs text-silver">Shipping Charged ($)</label><input type="number" step="0.01" min="0" className="input-field text-sm" value={form.shippingPrice} onChange={e => setForm({...form, shippingPrice: e.target.value})} /></div>
                <div><label className="text-xs text-silver">Platform Fees ($)</label><input type="number" step="0.01" min="0" className="input-field text-sm" value={form.platformFees} onChange={e => setForm({...form, platformFees: e.target.value})} /></div>
              </div>
              {form.salePrice && <p className="text-xs text-silver">Net proceeds: <span className="text-electric font-bold">${netProceeds()}</span></p>}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-silver">Order / Transaction ID</label><input className="input-field text-sm" value={form.externalOrderId} onChange={e => setForm({...form, externalOrderId: e.target.value})} /></div>
                <div>
                  <label className="text-xs text-silver">Payment Status</label>
                  <select className="input-field text-sm" value={form.paymentStatus} onChange={e => setForm({...form, paymentStatus: e.target.value})}>
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="NOT_APPLICABLE">N/A (cash/local)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-silver">Buyer Name</label><input className="input-field text-sm" value={form.externalBuyerName} onChange={e => setForm({...form, externalBuyerName: e.target.value})} /></div>
                <div><label className="text-xs text-silver">Buyer Contact</label><input className="input-field text-sm" placeholder="Email, username, etc." value={form.externalBuyerContact} onChange={e => setForm({...form, externalBuyerContact: e.target.value})} /></div>
              </div>
              <div><label className="text-xs text-silver">Notes</label><textarea className="input-field text-sm min-h-[60px]" placeholder="Any additional details..." value={form.externalNotes} onChange={e => setForm({...form, externalNotes: e.target.value})} /></div>
              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary text-sm">Back</button>
                <button type="button" onClick={() => setStep(3)} disabled={!canAdvance(2)} className="btn-primary text-sm">Next: Shipping</button>
              </div>
            </div>
          )}

          {/* Step 3: Shipping */}
          {step === 3 && (
            <div className="card-surface p-6 space-y-4">
              <h2 className="font-semibold">Shipping &amp; Tracking (Optional)</h2>
              <p className="text-xs text-silver">Skip this step if the sale was local or you don&apos;t have tracking info yet.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-silver">Carrier</label>
                  <select className="input-field text-sm" value={form.carrier} onChange={e => setForm({...form, carrier: e.target.value})}>
                    <option value="">None</option>
                    <option value="USPS">USPS</option><option value="UPS">UPS</option><option value="FEDEX">FedEx</option><option value="DHL">DHL</option><option value="OTHER">Other</option>
                  </select>
                </div>
                <div><label className="text-xs text-silver">Shipped Date</label><input type="date" className="input-field text-sm" value={form.shippedDate} onChange={e => setForm({...form, shippedDate: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-silver">Tracking Number</label><input className="input-field text-sm" value={form.trackingNumber} onChange={e => setForm({...form, trackingNumber: e.target.value})} /></div>
                <div><label className="text-xs text-silver">Tracking URL</label><input className="input-field text-sm" value={form.trackingUrl} onChange={e => setForm({...form, trackingUrl: e.target.value})} /></div>
              </div>
              <div className="border-t border-silver/10 pt-3 mt-3">
                <p className="text-xs text-silver mb-2">Buyer Shipping Address</p>
                <input className="input-field text-sm mb-2" placeholder="Recipient Name" value={form.externalShippingName} onChange={e => setForm({...form, externalShippingName: e.target.value})} />
                <input className="input-field text-sm mb-2" placeholder="Address Line 1" value={form.addressLine1} onChange={e => setForm({...form, addressLine1: e.target.value})} />
                <input className="input-field text-sm mb-2" placeholder="Address Line 2" value={form.addressLine2} onChange={e => setForm({...form, addressLine2: e.target.value})} />
                <div className="grid grid-cols-3 gap-2">
                  <input className="input-field text-sm" placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                  <input className="input-field text-sm" placeholder="State" value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
                  <input className="input-field text-sm" placeholder="Zip" value={form.postalCode} onChange={e => setForm({...form, postalCode: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary text-sm">Back</button>
                <button type="button" onClick={() => setStep(4)} className="btn-primary text-sm">Next: Review</button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="card-surface p-6 space-y-4">
              <h2 className="font-semibold">Review &amp; Confirm</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-silver">Item:</span> <span>{form.itemType === 'ITEM' ? form.inventoryItemId : form.inventoryGroupId}</span></div>
                <div><span className="text-silver">Platform:</span> <span>{form.externalPlatform}</span></div>
                <div><span className="text-silver">Sale Date:</span> <span>{form.externalSaleDate}</span></div>
                <div><span className="text-silver">Sale Price:</span> <span className="text-electric font-bold">${form.salePrice || '0'}</span></div>
                {form.shippingPrice && <div><span className="text-silver">Shipping:</span> <span>${form.shippingPrice}</span></div>}
                {form.platformFees && <div><span className="text-silver">Fees:</span> <span className="text-red-400">-${form.platformFees}</span></div>}
                <div><span className="text-silver">Net:</span> <span className="text-green-400 font-bold">${netProceeds()}</span></div>
                <div><span className="text-silver">Payment:</span> <span>{form.paymentStatus}</span></div>
                {form.externalBuyerName && <div><span className="text-silver">Buyer:</span> <span>{form.externalBuyerName}</span></div>}
                {form.externalOrderId && <div><span className="text-silver">Order ID:</span> <span>{form.externalOrderId}</span></div>}
                {form.trackingNumber && <div><span className="text-silver">Tracking:</span> <span>{form.carrier} {form.trackingNumber}</span></div>}
              </div>
              {form.externalNotes && <div className="text-xs text-silver border-t border-silver/10 pt-2 mt-2">{form.externalNotes}</div>}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setStep(3)} className="btn-secondary text-sm">Back</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Recording...' : 'Confirm & Record Sale'}</button>
              </div>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
