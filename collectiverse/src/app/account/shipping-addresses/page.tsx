'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ShippingAddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function emptyForm() {
    return { label: '', fullName: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'US', phone: '', isDefault: false, addressType: 'BOTH' };
  }

  const load = () => {
    fetch('/api/shipping-addresses')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setAddresses(d.addresses || []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const url = editingId ? `/api/shipping-addresses/${editingId}` : '/api/shipping-addresses';
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setShowForm(false); setEditingId(null); setForm(emptyForm()); load(); }
    else { const d = await res.json(); alert(d.error || 'Failed'); }
    setSaving(false);
  };

  const handleEdit = (addr: any) => {
    setEditingId(addr.id);
    setForm({ label: addr.label || '', fullName: addr.fullName, addressLine1: addr.addressLine1, addressLine2: addr.addressLine2 || '', city: addr.city, state: addr.state, postalCode: addr.postalCode, country: addr.country, phone: addr.phone || '', isDefault: addr.isDefault, addressType: addr.addressType });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    await fetch(`/api/shipping-addresses/${id}`, { method: 'DELETE' });
    load();
  };

  const handleSetDefault = async (id: string) => {
    await fetch(`/api/shipping-addresses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDefault: true }) });
    load();
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Shipping Addresses</h1>
          <div className="flex gap-2">
            <Link href="/account" className="text-sm text-silver hover:text-electric">Account</Link>
            <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm()); }} className="btn-primary text-sm">{showForm ? 'Cancel' : '+ Add Address'}</button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card-surface p-6 mb-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-silver">Label</label><input className="input-field text-sm" placeholder="Home, Office..." value={form.label} onChange={e => setForm({...form, label: e.target.value})} /></div>
              <div><label className="text-xs text-silver">Full Name *</label><input className="input-field text-sm" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required /></div>
            </div>
            <div><label className="text-xs text-silver">Address Line 1 *</label><input className="input-field text-sm" value={form.addressLine1} onChange={e => setForm({...form, addressLine1: e.target.value})} required /></div>
            <div><label className="text-xs text-silver">Address Line 2</label><input className="input-field text-sm" value={form.addressLine2} onChange={e => setForm({...form, addressLine2: e.target.value})} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-silver">City *</label><input className="input-field text-sm" value={form.city} onChange={e => setForm({...form, city: e.target.value})} required /></div>
              <div><label className="text-xs text-silver">State *</label><input className="input-field text-sm" value={form.state} onChange={e => setForm({...form, state: e.target.value})} required /></div>
              <div><label className="text-xs text-silver">Postal Code *</label><input className="input-field text-sm" value={form.postalCode} onChange={e => setForm({...form, postalCode: e.target.value})} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-silver">Country</label><input className="input-field text-sm" value={form.country} onChange={e => setForm({...form, country: e.target.value})} /></div>
              <div><label className="text-xs text-silver">Phone</label><input className="input-field text-sm" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            </div>
            <div className="flex gap-4 flex-wrap items-center">
              <select className="input-field text-sm w-48" value={form.addressType} onChange={e => setForm({...form, addressType: e.target.value})}>
                <option value="BOTH">Shipping &amp; Return</option>
                <option value="BUYER_SHIPPING">Buyer Shipping Only</option>
                <option value="SELLER_RETURN">Seller Return Only</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-silver cursor-pointer"><input type="checkbox" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} /> Set as default</label>
              <button type="submit" disabled={saving} className="btn-primary text-sm ml-auto">{saving ? 'Saving...' : editingId ? 'Update' : 'Save Address'}</button>
            </div>
          </form>
        )}

        {addresses.length === 0 && !showForm ? (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Addresses Saved</h2>
            <p className="text-silver text-sm mb-4">Add shipping addresses to speed up purchases and shipments.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">Add Your First Address</button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr: any) => (
              <div key={addr.id} className={`card-surface p-4 ${addr.isDefault ? 'border-electric/30 border' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{addr.fullName}</p>
                      {addr.label && <span className="badge bg-silver/10 text-xs">{addr.label}</span>}
                      {addr.isDefault && <span className="badge bg-electric/20 text-electric text-xs">Default</span>}
                      <span className="badge bg-silver/10 text-xs">{addr.addressType === 'BOTH' ? 'Ship & Return' : addr.addressType === 'BUYER_SHIPPING' ? 'Shipping' : 'Return'}</span>
                    </div>
                    <p className="text-sm text-silver">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
                    <p className="text-sm text-silver">{addr.city}, {addr.state} {addr.postalCode} {addr.country}</p>
                    {addr.phone && <p className="text-xs text-silver mt-1">{addr.phone}</p>}
                  </div>
                  <div className="flex gap-2">
                    {!addr.isDefault && <button onClick={() => handleSetDefault(addr.id)} className="text-electric text-xs hover:underline">Set Default</button>}
                    <button onClick={() => handleEdit(addr)} className="text-silver text-xs hover:text-white">Edit</button>
                    <button onClick={() => handleDelete(addr.id)} className="text-red-400 text-xs hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
