'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function SellerPage() {
  const { userId } = useParams();
  const [listings, setListings] = useState<any[]>([]);
  const [reputation, setReputation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/marketplace?sellerId=${userId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/reputation/${userId}`).then(r => r.ok ? r.json() : null),
    ]).then(([mktData, repData]) => {
      if (mktData) setListings(mktData.listings || []);
      if (repData) setReputation(repData);
    }).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  const seller = reputation?.seller;
  const rep = reputation?.reputation;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/marketplace" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Marketplace</Link>

        {seller && (
          <div className="card-surface p-6 mb-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-electric/20 flex items-center justify-center text-xl font-bold text-electric">
              {seller.displayName?.charAt(0) || '?'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{seller.displayName}</h1>
              <div className="flex gap-3 text-sm text-silver">
                {rep && <span>{rep.reputationScore}% positive</span>}
                {rep && <span>{rep.totalSales} sales</span>}
                {rep?.verifiedCollector && <span className="text-green-400">✓ Verified</span>}
              </div>
            </div>
            <Link href={`/profile/${userId}`} className="ml-auto btn-secondary text-xs">Full Profile</Link>
          </div>
        )}

        <h2 className="text-lg font-semibold mb-4">Active Listings ({listings.length})</h2>

        {listings.length === 0 ? (
          <p className="text-silver">No active listings from this seller.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((l: any) => (
              <Link key={l.id} href={`/marketplace/${l.id}`} className="card-surface p-5 hover:border-electric/30 transition-colors group">
                <p className="font-semibold group-hover:text-electric">{l.item?.playerName || l.item?.name || 'Listing'}</p>
                <p className="text-xs text-silver">{l.item?.setName} {l.item?.cardNumber && `#${l.item.cardNumber}`}</p>
                {l.price && <p className="text-electric font-bold mt-2">${l.price}</p>}
                <div className="flex gap-1 mt-1">
                  {l.allowOffers && <span className="badge bg-green-500/20 text-green-400 text-[10px]">Offers</span>}
                  {l.allowTrades && <span className="badge bg-purple-500/20 text-purple-400 text-[10px]">Trades</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
