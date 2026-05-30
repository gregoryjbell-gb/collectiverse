'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DataQualityPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/data-quality')
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
          <h1 className="text-2xl font-bold">Data Quality</h1>
          <Link href="/admin/operations" className="text-sm text-silver hover:text-electric">← Operations</Link>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Stat value={data.summary.missingRequiredFields} label="Missing Fields" color="text-amber-400" />
          <Stat value={data.summary.needsReview} label="Needs Review" color="text-red-400" />
          <Stat value={data.summary.sourceConflicts} label="Conflicts" color="text-purple-400" />
          <Stat value={data.summary.missingImages} label="No Image" color="text-silver" />
          <Stat value={data.imports.failed} label="Failed Imports" color="text-red-400" />
        </div>

        {/* Card Quality */}
        <div className="card-surface p-5 mb-6">
          <h2 className="font-semibold text-sm mb-3">Public Card Quality</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Issue label="Missing year" count={data.cards.missingYear} />
            <Issue label="Missing set" count={data.cards.missingSet} />
            <Issue label="Missing card #" count={data.cards.missingNumber} />
            <Issue label="Missing image" count={data.cards.missingImage} />
            <Issue label="USER_IMPORTED" count={data.cards.userImported} href="/admin/card-reviews" />
            <Issue label="NEEDS_REVIEW" count={data.cards.needsReview} href="/admin/card-reviews" />
            <Issue label="No Collectible link" count={data.cards.noCollectible} />
            <Issue label="Verification conflicts" count={data.verification.conflicted} href="/admin/verification" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-surface p-5 mb-6">
          <h2 className="font-semibold text-sm mb-3">Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/card-reviews" className="btn-secondary text-xs">Review Cards</Link>
            <Link href="/admin/duplicates" className="btn-secondary text-xs">Duplicates</Link>
            <Link href="/admin/verification" className="btn-secondary text-xs">Verification</Link>
            <Link href="/admin/card-identities" className="btn-secondary text-xs">Identities</Link>
            <Link href="/admin/import" className="btn-secondary text-xs">Imports</Link>
            <Link href="/admin/import-jobs" className="btn-secondary text-xs">Import Jobs</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return <div className="card-surface p-3 text-center"><p className={`text-xl font-bold ${color}`}>{value}</p><p className="text-xs text-silver">{label}</p></div>;
}

function Issue({ label, count, href }: { label: string; count: number; href?: string }) {
  if (count === 0) return <div className="text-xs text-silver py-1">{label}: <span className="text-green-400">0</span></div>;
  const content = <div className="text-xs py-1">{label}: <span className="text-amber-400 font-bold">{count}</span></div>;
  return href ? <Link href={href} className="hover:text-electric">{content}</Link> : content;
}
