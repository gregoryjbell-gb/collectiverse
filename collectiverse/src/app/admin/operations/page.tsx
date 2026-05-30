'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminOperationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/operations')
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
          <h1 className="text-2xl font-bold">Admin Operations</h1>
          <Link href="/admin" className="text-sm text-silver hover:text-electric">← Admin</Link>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <CountCard value={data.reportCounts.pending} label="Pending Reports" color="text-red-400" href="/admin?tab=reports" />
          <CountCard value={data.reviewCounts.cardReviews} label="Card Reviews" color="text-amber-400" href="/admin/card-reviews" />
          <CountCard value={data.disputeCounts.active} label="Active Disputes" color="text-purple-400" href="/disputes" />
          <CountCard value={data.liveCounts.active} label="Live Now" color="text-red-400" href="/live" />
          <CountCard value={data.importCounts.processing} label="Imports Active" color="text-blue-400" href="/admin/import-jobs" />
        </div>

        {/* Needs Review */}
        <div className="card-surface p-5 mb-6">
          <h2 className="font-semibold text-sm mb-3 text-amber-400">Needs Review</h2>
          <div className="space-y-2">
            <OpRow label="Pending reports" count={data.reportCounts.pending} href="/admin?tab=reports" />
            <OpRow label="Copyright/takedown reports" count={data.reportCounts.copyright} href="/admin?tab=reports" priority />
            <OpRow label="User-imported card reviews" count={data.reviewCounts.cardReviews} href="/admin/card-reviews" />
            <OpRow label="Provisional cards needing review" count={data.reviewCounts.provisionalCards} href="/admin/card-reviews" />
            <OpRow label="Verification conflicts" count={data.reviewCounts.verificationConflicts} href="/admin/verification" />
            <OpRow label="Active disputes" count={data.disputeCounts.active} href="/disputes" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-surface p-5 mb-6">
          <h2 className="font-semibold text-sm mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin?tab=reports" className="btn-secondary text-xs">Reports</Link>
            <Link href="/admin/card-reviews" className="btn-secondary text-xs">Card Reviews</Link>
            <Link href="/admin/duplicates" className="btn-secondary text-xs">Duplicates</Link>
            <Link href="/admin/import" className="btn-secondary text-xs">Imports</Link>
            <Link href="/admin/verification" className="btn-secondary text-xs">Verification</Link>
            <Link href="/admin/system-health" className="btn-secondary text-xs">System Health</Link>
          </div>
        </div>

        {/* Data & Live */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card-surface p-5">
            <h2 className="font-semibold text-sm mb-3">Data Operations</h2>
            <div className="space-y-2">
              <OpRow label="Processing/failed imports" count={data.importCounts.processing} href="/admin/import-jobs" />
              <OpRow label="Verification conflicts" count={data.reviewCounts.verificationConflicts} href="/admin/verification" />
              <Link href="/admin/card-identities" className="text-xs text-electric hover:underline block">Card Identities →</Link>
              <Link href="/admin/manufacturers" className="text-xs text-electric hover:underline block">Manufacturers →</Link>
            </div>
          </div>
          <div className="card-surface p-5">
            <h2 className="font-semibold text-sm mb-3">Live Operations</h2>
            <div className="space-y-2">
              <OpRow label="Live events active" count={data.liveCounts.active} href="/live" />
              <Link href="/admin?tab=disputes" className="text-xs text-electric hover:underline block">Disputes →</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function CountCard({ value, label, color, href }: { value: number; label: string; color: string; href: string }) {
  return <Link href={href} className="card-surface p-3 text-center hover:border-electric/30 transition-colors"><p className={`text-xl font-bold ${color}`}>{value}</p><p className="text-xs text-silver">{label}</p></Link>;
}

function OpRow({ label, count, href, priority }: { label: string; count: number; href: string; priority?: boolean }) {
  if (count === 0) return null;
  return (
    <Link href={href} className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-silver/5 transition-colors">
      <span className="text-sm">{label}</span>
      <span className={`badge text-xs ${priority ? 'bg-red-400/20 text-red-400' : 'bg-amber-400/20 text-amber-400'}`}>{count}</span>
    </Link>
  );
}
