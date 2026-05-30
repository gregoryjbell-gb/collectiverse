'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import OnboardingChecklist from '@/components/OnboardingChecklist';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(d => { if (d?.user) setUser(d.user); setChecked(true); }).catch(() => setChecked(true));
  }, []);

  if (!checked) return <main className="min-h-screen py-16 px-6"><div className="text-silver text-center">Loading...</div></main>;

  if (user) return <AuthenticatedHome user={user} />;
  return <PublicHome />;
}

function PublicHome() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-20 px-6 text-center">
        <img src="/brand/collectiverse-logo.png" alt="Collectiverse" className="mx-auto w-48 mb-6" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Your Collection.<br />Your Universe.</h1>
        <p className="text-silver text-lg max-w-2xl mx-auto mb-8">Track, buy, sell, and showcase sports cards, comics, coins, memorabilia, toys, vinyl, video games, and more — all in one place.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/register" className="btn-primary text-lg px-8 py-3">Start Free</Link>
          <Link href="/marketplace" className="btn-secondary text-lg px-8 py-3">Browse Marketplace</Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 border-t border-silver/10">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          <FeatureBlock icon="📦" title="Track Everything" desc="Inventory management for cards, comics, coins, toys, vinyl, games, and memorabilia." />
          <FeatureBlock icon="🛒" title="Buy & Sell" desc="Marketplace with offers, Buy Now, and full sale lifecycle tracking." />
          <FeatureBlock icon="🔴" title="Go Live" desc="Host live sales, auctions, claim sales, and breaks with real-time chat." />
          <FeatureBlock icon="📥" title="Import Anywhere" desc="Upload from Ludex, Collectr, CollX, Cardly AI, or any CSV." />
          <FeatureBlock icon="📊" title="Analytics" desc="Portfolio value, profit/loss, ROI, and market trends." />
          <FeatureBlock icon="🤖" title="Meet Atlas" desc="Your AI-powered guide through the Collectiverse." />
        </div>
      </section>

      {/* Collectible Types */}
      <section className="py-16 px-6 border-t border-silver/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">One Platform. Every Collectible.</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {['Sports Cards', 'Pokémon / TCG', 'Comics', 'Sealed Products', 'Memorabilia', 'Coins', 'Video Games', 'Toys & Figures', 'Vinyl & Music', 'Tickets'].map(t => (
              <span key={t} className="badge bg-gunmetal/50 text-silver px-3 py-1.5">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-silver/10 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to explore?</h2>
        <p className="text-silver mb-6">Free forever for casual collectors. Upgrade when you need more.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/register" className="btn-primary">Create Account</Link>
          <Link href="/pricing" className="btn-secondary">View Plans</Link>
        </div>
      </section>
    </main>
  );
}

function AuthenticatedHome({ user }: { user: any }) {
  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Welcome back, {user.displayName || user.username}</h1>
        <p className="text-silver text-sm mb-6">What would you like to do today?</p>

        <OnboardingChecklist />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <QuickAction href="/inventory/add/select-type" icon="📦" label="Add Collectible" />
          <QuickAction href="/inventory/import" icon="📥" label="Import" />
          <QuickAction href="/inventory" icon="🗂️" label="My Inventory" />
          <QuickAction href="/marketplace" icon="🛒" label="Marketplace" />
          <QuickAction href="/listings/add" icon="🏷️" label="Create Listing" />
          <QuickAction href="/live" icon="🔴" label="Live Events" />
          <QuickAction href="/analytics" icon="📊" label="Analytics" />
          <QuickAction href="/dashboard" icon="📋" label="Dashboard" />
        </div>

        {/* Role-specific */}
        {user.role === 'ADMIN' && (
          <div className="card-surface p-4 mb-4">
            <p className="text-xs text-silver uppercase tracking-wider mb-2">Admin</p>
            <div className="flex gap-2 flex-wrap">
              <Link href="/admin" className="text-xs text-electric hover:underline">Dashboard</Link>
              <Link href="/admin/card-reviews" className="text-xs text-electric hover:underline">Reviews</Link>
              <Link href="/admin/system-health" className="text-xs text-electric hover:underline">Health</Link>
              <Link href="/admin/import" className="text-xs text-electric hover:underline">Imports</Link>
            </div>
          </div>
        )}

        {/* Browse */}
        <div className="card-surface p-4">
          <p className="text-xs text-silver uppercase tracking-wider mb-2">Browse</p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/cards" className="text-sm text-silver hover:text-electric">Cards</Link>
            <Link href="/comics" className="text-sm text-silver hover:text-electric">Comics</Link>
            <Link href="/sealed-products" className="text-sm text-silver hover:text-electric">Sealed</Link>
            <Link href="/memorabilia" className="text-sm text-silver hover:text-electric">Memorabilia</Link>
            <Link href="/coins" className="text-sm text-silver hover:text-electric">Coins</Link>
            <Link href="/video-games" className="text-sm text-silver hover:text-electric">Games</Link>
            <Link href="/toys" className="text-sm text-silver hover:text-electric">Toys</Link>
            <Link href="/music" className="text-sm text-silver hover:text-electric">Music</Link>
            <Link href="/collectibles" className="text-sm text-silver hover:text-electric">All</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureBlock({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return <div className="card-surface p-5 text-center"><span className="text-2xl block mb-2">{icon}</span><p className="font-medium text-sm">{title}</p><p className="text-xs text-silver mt-1">{desc}</p></div>;
}

function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  return <Link href={href} className="card-surface p-3 text-center hover:border-electric/30 transition-colors"><span className="text-lg block">{icon}</span><p className="text-xs text-silver mt-1">{label}</p></Link>;
}
