'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<'collection' | 'selling' | 'live' | 'account'>('collection');
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
      <div className="max-w-5xl mx-auto">
        {/* Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Stat value={`$${(data.totalEstimatedValue || 0).toLocaleString()}`} label="Collection Value" />
          <Stat value={data.totalCards || 0} label="Total Items" />
          <Stat value={data.forSaleCount || 0} label="Active Listings" />
          <Stat value={(data.watchlistCount || 0)} label="Wishlist" />
          <Stat value={`${data.roi || 0}%`} label="ROI" positive={data.roi >= 0} />
        </div>

        {/* Primary Actions */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link href="/inventory/add/select-type" className="btn-primary text-sm">+ Add Collectible</Link>
          <Link href="/inventory/import" className="btn-secondary text-sm">Import</Link>
          <Link href="/listings/add" className="btn-secondary text-sm">Create Listing</Link>
          <Link href="/sales/manual" className="btn-secondary text-sm">External Sale</Link>
          <Link href="/live/create" className="btn-secondary text-sm">Start Live</Link>
          <Link href="/analytics" className="btn-secondary text-sm">Analytics</Link>
        </div>

        {/* Needs Attention */}
        <NeedsAttention data={data} />

        {/* Grouped Sections */}
        <div className="flex gap-2 mb-4 mt-6 overflow-x-auto">
          {(['collection', 'selling', 'live', 'account'] as const).map(s => (
            <button key={s} onClick={() => setSection(s)} className={`px-4 py-2 rounded-lg text-sm capitalize whitespace-nowrap transition-colors ${section === s ? 'bg-electric text-white' : 'bg-gunmetal/50 text-silver hover:text-white'}`}>{s}</button>
          ))}
        </div>

        {section === 'collection' && (
          <div className="card-surface p-5 space-y-2">
            <QuickLink href="/inventory" label="Inventory" desc="All owned items" />
            <QuickLink href="/inventory/groups" label="Groups / Lots / Sets" desc="Sealed, binders, lots" />
            <QuickLink href="/wishlist" label="Wishlist" desc="Target acquisitions" />
            <QuickLink href="/analytics" label="Analytics" desc="Portfolio insights" />
            <QuickLink href="/qr-labels" label="QR Labels" desc="Print labels" />
            <QuickLink href="/checklists" label="Checklists" desc="Set completion" />
          </div>
        )}

        {section === 'selling' && (
          <div className="card-surface p-5 space-y-2">
            <QuickLink href="/listings" label="Listings" desc="Active and draft listings" />
            <QuickLink href="/offers" label="Offers" desc="Sent and received" />
            <QuickLink href="/sales" label="Sales" desc="All transactions" />
            <QuickLink href="/sales/manual" label="Record External Sale" desc="eBay, COMC, Facebook, etc." />
            <QuickLink href="/shipments" label="Shipments" desc="Tracking and delivery" />
            <QuickLink href="/payments" label="Payments" desc="Payment status" />
            <QuickLink href="/disputes" label="Disputes" desc="Issue resolution" />
            <QuickLink href="/feedback" label="Feedback" desc="Reputation" />
          </div>
        )}

        {section === 'live' && (
          <div className="card-surface p-5 space-y-2">
            <QuickLink href="/live/studio" label="Live Studio" desc="Manage your events" />
            <QuickLink href="/live/my-activity" label="My Live Activity" desc="Claims, bids, spots" />
            <QuickLink href="/live" label="Browse Live" desc="Live now + upcoming" />
            <QuickLink href="/live/create" label="Create Event" desc="New live sale or break" />
          </div>
        )}

        {section === 'account' && (
          <div className="card-surface p-5 space-y-2">
            <QuickLink href="/notifications" label="Notifications" desc="Alerts and updates" />
            <QuickLink href="/account/shipping-addresses" label="Shipping Addresses" desc="Manage addresses" />
            <QuickLink href="/activity" label="Activity" desc="Account history" />
            <QuickLink href="/account" label="Profile" desc="Settings" />
          </div>
        )}

        {/* Top by Value */}
        {data.topByValue?.length > 0 && (
          <div className="card-surface p-5 mt-6">
            <h3 className="font-semibold text-sm mb-3">Top Items by Value</h3>
            <div className="space-y-2">
              {data.topByValue.slice(0, 5).map((item: any) => (
                <Link key={item.id} href={`/inventory/${item.id}`} className="flex justify-between items-center py-1.5 border-b border-silver/10 last:border-0 hover:bg-silver/5 px-2 rounded transition-colors">
                  <div><p className="text-sm">{item.playerName}</p><p className="text-xs text-silver">{item.setName} #{item.cardNumber}</p></div>
                  <span className="text-electric font-bold text-sm">${item.estimatedValue?.toLocaleString()}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ value, label, positive }: { value: string | number; label: string; positive?: boolean }) {
  const color = positive === undefined ? 'text-electric' : positive ? 'text-green-400' : 'text-red-400';
  return <div className="card-surface p-3 text-center"><p className={`text-lg font-bold ${color}`}>{value}</p><p className="text-xs text-silver">{label}</p></div>;
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href} className="flex justify-between items-center py-2 px-2 rounded-lg hover:bg-silver/5 transition-colors">
      <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-silver">{desc}</p></div>
      <span className="text-xs text-silver">→</span>
    </Link>
  );
}

function NeedsAttention({ data }: { data: any }) {
  const items: { label: string; href: string; count?: number }[] = [];
  if (data.forSaleCount > 0) items.push({ label: 'Active listings', href: '/listings', count: data.forSaleCount });
  // These would come from a dedicated API in production
  return items.length > 0 ? (
    <div className="card-surface p-4 border-amber-400/20 border">
      <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-2">Needs Attention</p>
      {items.map((item, i) => (
        <Link key={i} href={item.href} className="flex justify-between items-center py-1.5 text-sm hover:bg-silver/5 rounded px-2 transition-colors">
          <span>{item.label}</span>
          {item.count && <span className="badge bg-amber-400/20 text-amber-400 text-xs">{item.count}</span>}
        </Link>
      ))}
    </div>
  ) : null;
}
