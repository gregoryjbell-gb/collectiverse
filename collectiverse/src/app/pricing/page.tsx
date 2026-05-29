'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  useEffect(() => { fetch('/api/membership/plans').then(r => r.json()).then(d => setPlans(d.plans || [])); }, []);

  return (
    <main className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-3">Collect. Track. Buy. Sell.</h1>
        <p className="text-silver text-lg mb-12 max-w-2xl mx-auto">Whether you own 50 collectibles or 50,000, Collectiverse gives you one place to manage your collection.</p>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan: any) => (
            <div key={plan.id} className={`card-surface p-6 text-left ${plan.tier === 'COLLECTOR' ? 'border-electric/30 border' : ''}`}>
              {plan.tier === 'COLLECTOR' && <p className="text-xs text-electric font-bold uppercase mb-2">Most Popular</p>}
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <p className="text-silver text-sm mb-4">{plan.description}</p>
              <p className="text-3xl font-bold text-electric mb-1">{plan.monthlyPrice === 0 ? 'Free' : `$${plan.monthlyPrice}/mo`}</p>
              {plan.yearlyPrice > 0 && <p className="text-xs text-silver mb-4">${plan.yearlyPrice}/year (save {Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)}%)</p>}
              <ul className="space-y-2 text-sm text-silver mt-4">
                <li>{plan.inventoryLimit >= 999999 ? '✓ Unlimited inventory' : `✓ ${plan.inventoryLimit} inventory items`}</li>
                <li>{plan.listingLimit >= 999999 ? '✓ Unlimited listings' : `✓ ${plan.listingLimit} active listings`}</li>
                <li>✓ {plan.storageLimitGb} GB storage</li>
                {plan.canImportInventory && <li>✓ Bulk imports & exports</li>}
                {plan.canUseAdvancedAnalytics && <li>✓ Advanced analytics</li>}
                {plan.canHostLiveEvents && <li>✓ Live event hosting</li>}
                {plan.canHostLiveAuctions && <li>✓ Live auctions</li>}
                {plan.canHostLiveBreaks && <li>✓ Live breaks</li>}
                {plan.canCreateStorefront && <li>✓ Storefront</li>}
                {plan.canUseApi && <li>✓ API access</li>}
                {plan.featuredListingsIncluded > 0 && <li>✓ {plan.featuredListingsIncluded} featured listings</li>}
              </ul>
              <div className="mt-6">
                {plan.tier === 'EXPLORER' ? <Link href="/register" className="btn-secondary text-sm w-full text-center block">Get Started Free</Link>
                : <button className="btn-primary text-sm w-full opacity-75 cursor-not-allowed">Coming Soon</button>}
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto text-left">
          <h2 className="text-2xl font-bold mb-6 text-center">FAQ</h2>
          <div className="space-y-4">
            <FAQ q="Can I cancel anytime?" a="Yes. Downgrade or cancel at any time. Your collection data is never deleted." />
            <FAQ q="What happens if I downgrade?" a="You keep all your data. Features above your plan limit become read-only until you upgrade again." />
            <FAQ q="Do I lose my collection?" a="Never. Your inventory, transaction history, and media are always yours regardless of plan." />
            <FAQ q="What happens to active listings?" a="Listings above your plan limit are paused, not deleted. Upgrade to reactivate them." />
          </div>
        </div>
      </div>
    </main>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return <div className="card-surface p-4"><p className="font-medium text-sm mb-1">{q}</p><p className="text-silver text-sm">{a}</p></div>;
}
