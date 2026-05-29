'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const router = useRouter();

  const load = () => {
    fetch('/api/admin/manufacturers')
      .then(r => { if (r.status === 403) { router.push('/admin'); return null; } return r.json(); })
      .then(d => { if (d) setManufacturers(d.manufacturers || []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/manufacturers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    if (res.ok) { setShowForm(false); setName(''); load(); }
    else { const d = await res.json(); alert(d.error || 'Failed'); }
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manufacturers</h1>
          <div className="flex gap-2">
            <Link href="/admin/brands" className="btn-secondary text-sm">Brands</Link>
            <Link href="/admin/product-releases" className="btn-secondary text-sm">Releases</Link>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">{showForm ? 'Cancel' : '+ Add'}</button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="card-surface p-4 mb-4 flex gap-3">
            <input className="input-field flex-1 text-sm" placeholder="Manufacturer name" value={name} onChange={e => setName(e.target.value)} required />
            <button type="submit" className="btn-primary text-sm">Create</button>
          </form>
        )}

        <div className="space-y-2">
          {manufacturers.map((m: any) => (
            <div key={m.id} className="card-surface p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{m.name}</p>
                <p className="text-xs text-silver">{m._count?.brands || 0} brands • {m._count?.productReleases || 0} releases</p>
              </div>
              <p className="text-xs text-silver font-mono">{m.normalizedName}</p>
            </div>
          ))}
          {manufacturers.length === 0 && <p className="text-silver text-center">No manufacturers yet.</p>}
        </div>
      </div>
    </main>
  );
}
