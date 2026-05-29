'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProductReleasesPage() {
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/product-releases')
      .then(r => { if (r.status === 403) { router.push('/admin'); return null; } return r.json(); })
      .then(d => { if (d) setReleases(d.releases || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Product Releases</h1>
          <div className="flex gap-2">
            <Link href="/admin/manufacturers" className="btn-secondary text-sm">Manufacturers</Link>
            <Link href="/admin/brands" className="btn-secondary text-sm">Brands</Link>
            <Link href="/admin" className="text-sm text-silver hover:text-electric">← Admin</Link>
          </div>
        </div>

        <div className="space-y-2">
          {releases.map((r: any) => (
            <div key={r.id} className="card-surface p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{r.name} ({r.year})</p>
                <p className="text-xs text-silver">{r.manufacturer?.name}{r.brand ? ` → ${r.brand.name}` : ''} • {r.category} • {r._count?.checklistSections || 0} sections</p>
              </div>
            </div>
          ))}
          {releases.length === 0 && <p className="text-silver text-center">No product releases yet. They are created automatically during imports.</p>}
        </div>
      </div>
    </main>
  );
}
