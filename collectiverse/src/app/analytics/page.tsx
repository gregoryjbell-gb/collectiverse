'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/analytics/portfolio')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading analytics...</div></main>;
  if (!data) return null;

  const { summary } = data;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Portfolio Analytics</h1>
          <Link href="/dashboard" className="btn-secondary text-sm">Dashboard</Link>
        </div>

        {/* Primary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          <MetricCard label="Total Cards" value={summary.totalItems} />
          <MetricCard label="Portfolio Value" value={`$${summary.totalValue.toLocaleString()}`} color="electric" />
          <MetricCard label="Invested" value={`$${summary.totalInvested.toLocaleString()}`} />
          <MetricCard label="Unrealized G/L" value={`${summary.unrealizedGL >= 0 ? '+' : ''}$${summary.unrealizedGL.toLocaleString()}`} color={summary.unrealizedGL >= 0 ? 'green' : 'red'} />
          <MetricCard label="Realized G/L" value={`$${summary.realizedGL.toLocaleString()}`} color={summary.realizedGL >= 0 ? 'green' : 'red'} />
          <MetricCard label="ROI" value={`${summary.roi}%`} color={summary.roi >= 0 ? 'green' : 'red'} />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          <MetricCard label="Graded" value={summary.gradedCount} />
          <MetricCard label="Raw" value={summary.rawCount} />
          <MetricCard label="Active Listings" value={summary.activeListings} />
          <MetricCard label="Total Sold" value={`$${summary.totalSoldValue.toLocaleString()}`} />
          <MetricCard label="Sealed Products" value={summary.sealedCount} />
          <MetricCard label="Groups" value={summary.totalGroups} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Top Items */}
          <div className="card-surface p-5">
            <h2 className="font-semibold mb-3">Top Items by Value</h2>
            <div className="space-y-2">
              {data.topItems.map((item: any, i: number) => (
                <Link key={item.id} href={`/inventory/${item.id}`} className="flex justify-between items-center py-1.5 border-b border-silver/10 last:border-0 hover:bg-silver/5 px-2 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-silver text-xs w-5">{i + 1}.</span>
                    <div>
                      <p className="font-medium">{item.playerName}</p>
                      <p className="text-xs text-silver">{item.setName} #{item.cardNumber} {item.gradeValue && `• ${item.condition} ${item.gradeValue}`}</p>
                    </div>
                  </div>
                  <span className="text-electric font-bold">${item.estimatedValue?.toLocaleString()}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Groups */}
          <div className="card-surface p-5">
            <h2 className="font-semibold mb-3">Top Groups by Value</h2>
            {data.topGroups.length === 0 ? <p className="text-silver text-sm">No groups yet.</p> : (
              <div className="space-y-2">
                {data.topGroups.map((g: any) => (
                  <Link key={g.id} href={`/inventory/groups/${g.id}`} className="flex justify-between items-center py-1.5 border-b border-silver/10 last:border-0 hover:bg-silver/5 px-2 rounded text-sm">
                    <div>
                      <p className="font-medium">{g.name}</p>
                      <p className="text-xs text-silver">{g.groupType.replace(/_/g, ' ')} • {g.itemCount} items</p>
                    </div>
                    {g.estimatedValue && <span className="text-electric font-bold">${g.estimatedValue.toLocaleString()}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Breakdowns */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <BreakdownCard title="By Category" data={data.byCategory} showValue />
          <BreakdownCard title="By Sport / Franchise" data={data.bySport} showValue />
          <BreakdownCard title="By Manufacturer" data={data.byManufacturer} showValue />
          <BreakdownCard title="By Status" data={data.byStatus} />
          <BreakdownCard title="By Storage Location" data={data.byStorage} />
          <BreakdownCard title="By Grade Company" data={data.byGradeCompany} />
        </div>

        {/* Acquisition Timeline */}
        {Object.keys(data.timeline).length > 0 && (
          <div className="card-surface p-5">
            <h2 className="font-semibold mb-3">Acquisition Timeline</h2>
            <div className="flex gap-1 items-end h-32 overflow-x-auto">
              {Object.entries(data.timeline).sort().map(([month, count]: [string, any]) => {
                const maxCount = Math.max(...Object.values(data.timeline) as number[]);
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={month} className="flex flex-col items-center min-w-[40px]">
                    <div className="bg-electric/60 rounded-t w-6" style={{ height: `${height}%` }} title={`${month}: ${count} cards`} />
                    <span className="text-[9px] text-silver mt-1 rotate-45 origin-left">{month.slice(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const colorClass = color === 'electric' ? 'text-electric' : color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : 'text-white';
  return (
    <div className="card-surface p-3 text-center">
      <p className={`text-lg font-bold ${colorClass}`}>{value}</p>
      <p className="text-xs text-silver">{label}</p>
    </div>
  );
}

function BreakdownCard({ title, data, showValue }: { title: string; data: Record<string, any>; showValue?: boolean }) {
  const entries = Object.entries(data || {}).sort((a: any, b: any) => {
    const aVal = typeof a[1] === 'object' ? a[1].count : a[1];
    const bVal = typeof b[1] === 'object' ? b[1].count : b[1];
    return bVal - aVal;
  }).slice(0, 8);
  if (entries.length === 0) return null;
  return (
    <div className="card-surface p-5">
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      <div className="space-y-1.5">
        {entries.map(([key, val]: [string, any]) => (
          <div key={key} className="flex justify-between text-xs">
            <span className="text-silver truncate mr-2">{key}</span>
            <span className="text-white font-medium shrink-0">
              {typeof val === 'object' ? `${val.count}${showValue ? ` • $${val.value.toLocaleString()}` : ''}` : val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
