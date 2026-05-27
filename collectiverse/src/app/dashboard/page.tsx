'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardData {
  totalCards: number;
  totalEstimatedValue: number;
  totalInvested: number;
  forSaleCount: number;
  rawCount: number;
  gradedCount: number;
  topByValue: Array<{ id: string; cardId: string; playerName: string; setName: string; cardNumber: string | null; estimatedValue: number | null; condition: string | null; gradeValue: string | null }>;
  recentAdditions: Array<{ id: string; cardId: string; playerName: string; setName: string; cardNumber: string | null; condition: string | null; gradeValue: string | null; addedAt: string }>;
  statusBreakdown: Record<string, number>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((r) => {
        if (r.status === 401) { router.push('/login'); return null; }
        return r.json();
      })
      .then((d) => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return null;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <Link href="/inventory" className="btn-primary">View Inventory</Link>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card-surface p-5 text-center">
            <p className="text-3xl font-bold text-electric">{data.totalCards}</p>
            <p className="text-silver text-sm">Total Cards</p>
          </div>
          <div className="card-surface p-5 text-center">
            <p className="text-3xl font-bold text-electric">${data.totalEstimatedValue.toLocaleString()}</p>
            <p className="text-silver text-sm">Estimated Value</p>
          </div>
          <div className="card-surface p-5 text-center">
            <p className="text-3xl font-bold text-electric">${data.totalInvested.toLocaleString()}</p>
            <p className="text-silver text-sm">Total Invested</p>
          </div>
          <div className="card-surface p-5 text-center">
            <p className="text-3xl font-bold text-electric">{data.forSaleCount}</p>
            <p className="text-silver text-sm">For Sale</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="card-surface p-5 text-center">
            <p className="text-2xl font-bold">{data.rawCount}</p>
            <p className="text-silver text-sm">Raw Cards</p>
          </div>
          <div className="card-surface p-5 text-center">
            <p className="text-2xl font-bold">{data.gradedCount}</p>
            <p className="text-silver text-sm">Graded Cards</p>
          </div>
          <div className="card-surface p-5 text-center">
            <p className="text-2xl font-bold">{data.totalInvested > 0 ? (((data.totalEstimatedValue - data.totalInvested) / data.totalInvested) * 100).toFixed(1) : '0'}%</p>
            <p className="text-silver text-sm">ROI</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Value */}
          <div className="card-surface p-6">
            <h2 className="text-xl font-semibold mb-4">Top 10 by Value</h2>
            {data.topByValue.length === 0 ? (
              <p className="text-silver text-sm">No items yet. <Link href="/cards" className="text-electric hover:underline">Browse cards to add</Link></p>
            ) : (
              <div className="space-y-2">
                {data.topByValue.map((item) => (
                  <Link key={item.id} href={`/inventory/${item.id}`} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0 hover:bg-silver/5 px-2 rounded transition-colors">
                    <div>
                      <p className="text-sm font-medium">{item.playerName}</p>
                      <p className="text-xs text-silver">{item.setName} #{item.cardNumber} {item.gradeValue && `• ${item.condition} ${item.gradeValue}`}</p>
                    </div>
                    <span className="text-electric font-bold text-sm">${item.estimatedValue?.toLocaleString()}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Additions */}
          <div className="card-surface p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Additions</h2>
            {data.recentAdditions.length === 0 ? (
              <p className="text-silver text-sm">Nothing added yet.</p>
            ) : (
              <div className="space-y-2">
                {data.recentAdditions.map((item) => (
                  <Link key={item.id} href={`/inventory/${item.id}`} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0 hover:bg-silver/5 px-2 rounded transition-colors">
                    <div>
                      <p className="text-sm font-medium">{item.playerName}</p>
                      <p className="text-xs text-silver">{item.setName} #{item.cardNumber}</p>
                    </div>
                    <span className="text-xs text-silver">{new Date(item.addedAt).toLocaleDateString()}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
