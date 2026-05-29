'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SealedProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (q?: string) => {
    setLoading(true);
    fetch(`/api/sealed-products${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setProducts(d.products || []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Sealed Products</h1>
          <Link href="/inventory/add/select-type" className="btn-primary text-sm">+ Add to Collection</Link>
        </div>
        <form onSubmit={e => { e.preventDefault(); load(search); }} className="flex gap-3 mb-6">
          <input className="input-field flex-1" placeholder="Search boxes, packs, cases..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn-primary text-sm">Search</button>
        </form>
        {loading ? <div className="text-silver text-center">Loading...</div> : products.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Sealed Products Yet</h2>
            <p className="text-silver text-sm mb-4">Sealed hobby boxes, retail boxes, packs, and cases will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p: any) => (
              <div key={p.id} className="card-surface p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-silver">{p.productType.replace(/_/g, ' ')}{p.year ? ` • ${p.year}` : ''}{p.configuration ? ` • ${p.configuration}` : ''}</p>
                </div>
                <span className={`badge text-xs ${p.sealed ? 'bg-green-400/20 text-green-400' : 'bg-silver/20 text-silver'}`}>{p.sealed ? '🔒 Sealed' : 'Opened'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
