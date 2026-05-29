'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardData {
  totalCards: number;
  distinctCards: number;
  totalEstimatedValue: number;
  totalInvested: number;
  gainLoss: number;
  roi: number;
  rawCount: number;
  gradedCount: number;
  forSaleCount: number;
  watchlistCount: number;
  topByValue: any[];
  recentAdditions: any[];
  bySport: Record<string, number>;
  bySet: Record<string, number>;
  byManufacturer: Record<string, number>;
  byStorage: Record<string, number>;
}

const featureCards = [
  { href: '/inventory', label: 'Inventory', desc: 'Manage individual cards and collectibles', icon: '📦', action: 'View Collection', countKey: 'totalCards' },
  { href: '/inventory/groups', label: 'Groups / Sets / Lots', desc: 'Manage sets, lots, binders, boxes, and sealed products', icon: '📁', action: 'View Groups', countKey: null },
  { href: '/wishlist', label: 'Wishlist', desc: 'Track cards you want to acquire', icon: '⭐', action: 'View Wishlist', countKey: 'watchlistCount' },
  { href: '/listings', label: 'Listings', desc: 'Create and manage items for sale', icon: '🏷️', action: 'View Listings', countKey: 'forSaleCount' },
  { href: '/offers', label: 'Offers', desc: 'Review sent and received offers', icon: '🤝', action: 'View Offers', countKey: null },
  { href: '/sales', label: 'Sales', desc: 'Track end-to-end sale transactions', icon: '💰', action: 'View Sales', countKey: null },
  { href: '/transfers', label: 'Transfers', desc: 'Track ownership transfers between users', icon: '🔄', action: 'View Transfers', countKey: null },
  { href: '/marketplace', label: 'Marketplace', desc: 'Browse and buy from other collectors', icon: '🛒', action: 'Browse Market', countKey: null },
  { href: '/shipments', label: 'Shipments', desc: 'Track shipments after sales', icon: '📬', action: 'View Shipments', countKey: null },
  { href: '/payments', label: 'Payments', desc: 'Track payment status', icon: '💳', action: 'View Payments', countKey: null },
  { href: '/disputes', label: 'Disputes', desc: 'Resolve transaction issues', icon: '⚖️', action: 'View Disputes', countKey: null },
  { href: '/notifications', label: 'Notifications', desc: 'Stay updated on activity and alerts', icon: '🔔', action: 'View All', countKey: null },
  { href: '/analytics', label: 'Analytics', desc: 'Portfolio insights and value trends', icon: '📊', action: 'View Analytics', countKey: null },
  { href: '/qr-labels', label: 'QR Labels', desc: 'Generate and print labels for your items', icon: '📱', action: 'Create Labels', countKey: null },
  { href: '/activity', label: 'Account Activity', desc: 'View login history and account actions', icon: '📋', action: 'View Activity', countKey: null },
  { href: '/feedback', label: 'Reputation / Feedback', desc: 'View your trust score and buyer/seller feedback', icon: '⭐', action: 'View Feedback', countKey: null },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
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

        {/* Primary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <StatCard value={data.totalCards} label="Total Cards" />
          <StatCard value={data.distinctCards} label="Distinct Cards" />
          <StatCard value={`$${data.totalEstimatedValue.toLocaleString()}`} label="Est. Value" />
          <StatCard value={`$${data.totalInvested.toLocaleString()}`} label="Invested" />
          <StatCard value={`${data.gainLoss >= 0 ? '+' : ''}$${data.gainLoss.toLocaleString()}`} label="Gain/Loss" positive={data.gainLoss >= 0} />
          <StatCard value={`${data.roi}%`} label="ROI" positive={data.roi >= 0} />
        </div>

        {/* Feature Cards */}
        <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {featureCards.map((card) => (
            <FeatureCard
              key={card.href}
              href={card.href}
              label={card.label}
              desc={card.desc}
              icon={card.icon}
              action={card.action}
              count={card.countKey ? (data as any)[card.countKey] : undefined}
            />
          ))}
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

function StatCard({ value, label, positive }: { value: string | number; label: string; positive?: boolean }) {
  const colorClass = positive === undefined ? 'text-electric' : positive ? 'text-green-400' : 'text-red-400';
  return (
    <div className="card-surface p-4 text-center">
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-silver text-xs">{label}</p>
    </div>
  );
}

function FeatureCard({ href, label, desc, icon, action, count }: {
  href: string; label: string; desc: string; icon: string; action: string; count?: number;
}) {
  return (
    <Link href={href} className="card-surface p-4 hover:border-electric/30 transition-colors group flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xl">{icon}</span>
          {count !== undefined && <span className="text-xs bg-electric/15 text-electric px-2 py-0.5 rounded-full font-medium">{count}</span>}
        </div>
        <p className="font-medium text-sm group-hover:text-electric transition-colors">{label}</p>
        <p className="text-xs text-silver mt-1">{desc}</p>
      </div>
      <p className="text-xs text-electric mt-3 opacity-0 group-hover:opacity-100 transition-opacity">{action} →</p>
    </Link>
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
