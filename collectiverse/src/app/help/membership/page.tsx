import Link from 'next/link';

export default function MembershipHelpPage() {
  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/help" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Help Center</Link>
        <h1 className="text-2xl font-bold mb-4">Membership &amp; Billing</h1>
        <div className="prose prose-invert max-w-none text-silver space-y-4">
          <h2 className="text-lg font-semibold text-white">Plans</h2>
          <ul className="list-disc list-inside"><li><strong>Explorer (Free)</strong> — 500 items, 10 listings, basic features</li><li><strong>Collector ($9.99/mo)</strong> — unlimited inventory, imports, advanced analytics</li><li><strong>Dealer ($29.99/mo)</strong> — live hosting, auctions, breaks, storefront</li></ul>
          <h2 className="text-lg font-semibold text-white">FAQ</h2>
          <p><strong>Can I cancel?</strong> Yes, anytime. Your data is never deleted.</p>
          <p><strong>What if I downgrade?</strong> Features above your plan become read-only. Nothing is lost.</p>
          <p><strong>What about active listings?</strong> They're paused, not deleted. Upgrade to reactivate.</p>
          <Link href="/pricing" className="btn-primary text-sm inline-block mt-4">View Plans</Link>
        </div>
      </div>
    </main>
  );
}
