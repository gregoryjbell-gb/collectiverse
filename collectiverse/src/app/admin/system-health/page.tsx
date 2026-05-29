'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SystemHealthPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/system-health')
      .then(r => { if (r.status === 403) { router.push('/admin'); return null; } return r.json(); })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return null;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">System Health</h1>
          <Link href="/admin" className="text-sm text-silver hover:text-electric">← Admin</Link>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card-surface p-4 text-center"><p className="text-2xl font-bold text-electric">{data.summary.total}</p><p className="text-xs text-silver">Total Features</p></div>
          <div className="card-surface p-4 text-center"><p className="text-2xl font-bold text-green-400">{data.summary.complete}</p><p className="text-xs text-silver">Complete</p></div>
          <div className="card-surface p-4 text-center"><p className="text-2xl font-bold text-amber-400">{data.summary.partial}</p><p className="text-xs text-silver">Partial</p></div>
          <div className="card-surface p-4 text-center"><p className="text-2xl font-bold">{data.prismaValid ? '✓' : '✗'}</p><p className="text-xs text-silver">Prisma Valid</p></div>
        </div>

        {data.gaps.length > 0 && (
          <div className="card-surface p-5 mb-6 border-amber-400/20 border">
            <h2 className="font-semibold text-amber-400 text-sm mb-3">Gaps ({data.gaps.length})</h2>
            {data.gaps.map((g: any) => (
              <div key={g.name} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0 text-sm">
                <span>{g.name}</span>
                <div className="flex gap-2">
                  {g.missingPage && <span className="badge bg-red-400/20 text-red-400 text-xs">No Page</span>}
                  {g.missingNav && <span className="badge bg-amber-400/20 text-amber-400 text-xs">No Nav</span>}
                  <span className="badge bg-silver/20 text-silver text-xs">{g.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card-surface p-5">
          <h2 className="font-semibold text-sm mb-3">All Features</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-silver/20 text-silver text-left">
                <th className="py-2 px-2">Feature</th><th className="py-2 px-2">Model</th><th className="py-2 px-2">API</th><th className="py-2 px-2">Page</th><th className="py-2 px-2">Nav</th><th className="py-2 px-2">Status</th>
              </tr></thead>
              <tbody>
                {data.features.map((f: any) => (
                  <tr key={f.name} className="border-b border-silver/10">
                    <td className="py-1.5 px-2 font-medium">{f.name}</td>
                    <td className="py-1.5 px-2 text-silver">{f.model}</td>
                    <td className="py-1.5 px-2 text-silver font-mono">{f.api}</td>
                    <td className="py-1.5 px-2 text-silver">{f.page}</td>
                    <td className="py-1.5 px-2 text-silver">{f.nav}</td>
                    <td className="py-1.5 px-2"><span className={`badge text-xs ${f.status === 'COMPLETE' ? 'bg-green-400/20 text-green-400' : f.status === 'PARTIAL' ? 'bg-amber-400/20 text-amber-400' : 'bg-red-400/20 text-red-400'}`}>{f.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
