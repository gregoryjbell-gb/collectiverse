'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return null;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <Link href="/inventory/add" className="btn-primary text-sm">+ Add Collectible</Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          <FeatureCard href="/inventory" label="Inventory" desc="My owned cards" />
          <FeatureCard href="/inventory/groups" label="Groups / Lots" desc="Sets, boxes, sealed" />
          <FeatureCard href="/wishlist" label="Wishlist" desc="Target acquisitions" />
          <FeatureCard href="/listings" label="Listings" desc="For sale items" />
          <FeatureCard href="/offers" label="Offers" desc="Sent & received" />
          <FeatureCard href="/notifications" label="Notifications" desc="Activity feed" />
          <FeatureCard href="/analytics" label="Analytics" desc="Portfolio insights" />
          <FeatureCard href="/shipments" label="Shipments" desc="Tracking" />
          <FeatureCard href="/payments" label="Payments" desc="Transaction records" />
          <FeatureCard href="/disputes" label="Disputes" desc="Issue resolution" />
          <FeatureCard href="/qr-labels" label="QR Labels" desc="Print labels" />
          <FeatureCard href="/account" label="Account" desc="Profile settings" />
        </div>

        {/* Primary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="card-surface p-4 text-center">
            <p className="text-2xl font-bold text-electric">{data.totalCards}</p>
            <p className="text-silver text-xs">Total Cards</p>
          </div>
          <div className="card-surface p-4 text-center">
            <p className="text-2xl font-bold text-electric">{data.distinctCards}</p>
            <p className="text-silver text-xs">Distinct Cards</p>
          </div>
          <div className="card-surface p-4 text-center">
            <p className="text-2xl font-bold text-electric">${data.totalEstimatedValue.toLocaleString()}</p>
            <p className="text-silver text-xs">Est. Value</p>
          </div>
          <div className="card-surface p-4 text-center">
            <p className="text-2xl font-bold text-electric">${data.totalInvested.toLocaleString()}</p>
            <p className="text-silver text-xs">Invested</p>
          </div>
          <div className="card-surface p-4 text-center">
            <p className={`text-2xl font-bold ${data.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.gainLoss >= 0 ? '+' : ''}${data.gainLoss.toLocaleString()}
            </p>
            <p className="text-silver text-xs">Gain/Loss</p>
          </div>
          <div className="card-surface p-4 text-center">
            <p className={`text-2xl font-bold ${data.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>{data.roi}%</p>
            <p className="text-silver text-xs">ROI</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card-surface p-4 text-center">
            <p className="text-xl font-bold">{data.rawCount}</p>
            <p className="text-silver text-xs">Raw</p>
          </div>
          <div className="card-surface p-4 text-center">
            <p className="text-xl font-bold">{data.gradedCount}</p>
            <p className="text-silver text-xs">Graded</p>
          </div>
          <div className="card-surface p-4 text-center">
            <p className="text-xl font-bold">{data.forSaleCount}</p>
            <p className="text-silver text-xs">For Sale</p>
          </div>
          <div className="card-surface p-4 text-center">
            <p className="text-xl font-bold">{data.watchlistCount}</p>
            <p className="text-silver text-xs">Watchlist</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Top by Value */}
          <div className="card-surface p-6">
            <h2 className="text-lg font-semibold mb-4">Top 10 by Value</h2>
            {data.topByValue.length === 0 ? (
              <p className="text-silver text-sm">No items yet. <Link href="/cards" className="text-electric hover:underline">Browse cards</Link></p>
            ) : (
              <div className="space-y-2">
                {data.topByValue.map((item: any) => (
                  <Link key={item.id} href={`/inventory/${item.id}`} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0 hover:bg-silver/5 px-2 rounded transition-colors">
                    <div>
                      <p className="text-sm font-medium">{item.playerName}</p>
                      <p className="text-xs text-silver">{item.setName} #{item.cardNumber} {item.gradeValue && `• ${item.condition} ${item.gradeValue}`}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-electric font-bold text-sm">${item.estimatedValue?.toLocaleString()}</span>
                      {item.purchasePrice && <p className="text-xs text-silver">Cost: ${item.purchasePrice.toLocaleString()}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Additions */}
          <div className="card-surface p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Additions</h2>
            {data.recentAdditions.length === 0 ? (
              <p className="text-silver text-sm">Nothing added yet.</p>
            ) : (
              <div className="space-y-2">
                {data.recentAdditions.map((item: any) => (
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

        {/* Breakdowns */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Breakdown title="By Sport" data={data.bySport} />
          <Breakdown title="By Set" data={data.bySet} />
          <Breakdown title="By Manufacturer" data={data.byManufacturer} />
          <Breakdown title="By Storage" data={data.byStorage} />
        </div>
      </div>
    </main>
  );
}

function Breakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (entries.length === 0) return null;
  return (
    <div className="card-surface p-5">
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      <div className="space-y-1.5">
        {entries.map(([key, count]) => (
          <div key={key} className="flex justify-between text-xs">
            <span className="text-silver truncate mr-2">{key}</span>
            <span className="text-white font-medium">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href} className="card-surface p-4 hover:border-electric/30 transition-colors group">
      <p className="font-medium text-sm group-hover:text-electric transition-colors">{label}</p>
      <p className="text-xs text-silver">{desc}</p>
    </Link>
  );
}
