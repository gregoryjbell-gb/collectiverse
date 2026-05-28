'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function MarketplaceDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/marketplace/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setListing(d.listing); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!listing) return <main className="min-h-screen py-12 px-6"><div className="text-center"><p className="text-silver text-lg">Listing not found or no longer active.</p><Link href="/marketplace" className="text-electric hover:underline mt-2 inline-block">Back to Marketplace</Link></div></main>;

  const item = listing.item;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/marketplace" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back to Marketplace</Link>

        <div className="card-surface p-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold">{item?.playerName || item?.name || 'Listing'}</h1>
              <p className="text-silver">{item?.setName} {item?.cardNumber && `#${item.cardNumber}`} {item?.year && `(${item.year})`}</p>
            </div>
            {listing.price && <p className="text-3xl font-bold text-electric">${listing.price}</p>}
          </div>

          {/* Item details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {item?.manufacturer && <div><p className="text-xs text-silver">Manufacturer</p><p className="text-sm">{item.manufacturer}</p></div>}
            {item?.teamName && <div><p className="text-xs text-silver">Team</p><p className="text-sm">{item.teamName}</p></div>}
            {item?.condition && <div><p className="text-xs text-silver">Condition</p><p className="text-sm">{item.gradeCompany ? `${item.gradeCompany} ${item.gradeValue}` : item.condition}</p></div>}
            {item?.certNumber && <div><p className="text-xs text-silver">Cert #</p><p className="text-sm">{item.certNumber}</p></div>}
            {item?.groupType && <div><p className="text-xs text-silver">Type</p><p className="text-sm">{item.groupType.replace(/_/g, ' ')}</p></div>}
            {item?.sealed !== undefined && <div><p className="text-xs text-silver">Sealed</p><p className="text-sm">{item.sealed ? 'Yes' : 'No'}</p></div>}
          </div>

          <div className="flex gap-2 flex-wrap mb-6">
            {item?.rookie && <span className="badge bg-amber-500/20 text-amber-400">Rookie</span>}
            {item?.autograph && <span className="badge bg-purple-500/20 text-purple-400">Autograph</span>}
            {item?.parallel && <span className="badge bg-electric/20 text-electric">{item.parallel}</span>}
            {listing.allowOffers && <span className="badge bg-green-500/20 text-green-400">Accepting Offers</span>}
            {listing.allowTrades && <span className="badge bg-purple-500/20 text-purple-400">Open to Trades</span>}
          </div>

          {listing.minimumOffer && <p className="text-sm text-silver mb-2">Minimum offer: ${listing.minimumOffer}</p>}
          {listing.description && <div className="mb-4"><p className="text-xs text-silver mb-1">Description</p><p className="text-sm">{listing.description}</p></div>}
          {listing.shippingNotes && <div className="mb-4"><p className="text-xs text-silver mb-1">Shipping</p><p className="text-sm">{listing.shippingNotes}</p></div>}

          <div className="border-t border-silver/10 pt-4 mt-4 flex justify-between items-center">
            <p className="text-sm text-silver">Listed by <span className="text-white font-medium">{listing.seller}</span></p>
            <p className="text-xs text-silver">{new Date(listing.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
