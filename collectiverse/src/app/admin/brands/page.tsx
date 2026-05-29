'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ manufacturerId: '', name: '' });
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/brands').then(r => r.ok ? r.json() : null),
      fetch('/api/admin/manufacturers').then(r => r.ok ? r.json() : null),
    ]).then(([b, m]) => {
      if (b) setBrands(b.brands || []);
      if (m) setManufacturers(m.manufacturers || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/brands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setShowForm(false); setForm({ manufacturerId: '', name: '' }); fetch('/api/admin/brands').then(r => r.json()).then(d => setBrands(d.brands || [])); }
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Brands</h1>
          <div className="flex gap-2">
            <Link href="/admin/manufacturers" className="btn-secondary text-sm">Manufacturers</Link>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">{showForm ? 'Cancel' : '+ Add'}</button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="card-surface p-4 mb-4 flex gap-3">
            <select className="input-field text-sm w-48" value={form.manufacturerId} onChange={e => setForm({...form, manufacturerId: e.target.value})} required>
              <option value="">Manufacturer...</option>
              {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input className="input-field flex-1 text-sm" placeholder="Brand name (e.g. Prizm, Chrome, Optic)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            <button type="submit" className="btn-primary text-sm">Create</button>
          </form>
        )}

        <div className="space-y-2">
          {brands.map((b: any) => (
            <div key={b.id} className="card-surface p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{b.name}</p>
                <p className="text-xs text-silver">{b.manufacturer?.name} • {b._count?.productReleases || 0} releases</p>
              </div>
            </div>
          ))}
          {brands.length === 0 && <p className="text-silver text-center">No brands yet.</p>}
        </div>
      </div>
    </main>
  );
}
