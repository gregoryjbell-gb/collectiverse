import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Atlas the Collectiverse Explorer',
  description: 'Follow Atlas as he explores the world of collectibles, cards, comics, sealed products, and hidden treasures.',
};

export default function AtlasPage() {
  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <img src="/brand/collectiverse-logo.png" alt="Collectiverse" className="mx-auto w-64 mb-6" />
          <h1 className="text-3xl font-bold mb-3">Atlas the Collectiverse Explorer</h1>
          <p className="text-silver text-lg max-w-2xl mx-auto">Follow Atlas as he explores the world of collectibles, cards, comics, sealed products, and hidden treasures.</p>
        </div>

        {/* Comic Strip */}
        <div className="card-surface p-4 mb-8">
          <img src="/brand/atlas/atlas-comic-strip.png" alt="Atlas the Collectiverse Explorer comic strip — Discover, Organize, Track, Protect, Connect, Discover More, Grow Your Legacy" className="w-full rounded-lg" />
        </div>

        {/* About Atlas */}
        <div className="card-surface p-6 mb-8">
          <h2 className="text-xl font-bold mb-3">Meet Atlas</h2>
          <p className="text-silver mb-4">Atlas is your guide through the Collectiverse — a universe of sports cards, Pokémon, comics, coins, memorabilia, toys, vinyl, video games, and everything collectors love.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gunmetal/30 rounded-lg p-4">
              <p className="font-medium text-sm mb-1">🔍 Discover</p>
              <p className="text-xs text-silver">Scan the universe to find information on millions of collectibles.</p>
            </div>
            <div className="bg-gunmetal/30 rounded-lg p-4">
              <p className="font-medium text-sm mb-1">📦 Organize</p>
              <p className="text-xs text-silver">Keep your collection organized in one place.</p>
            </div>
            <div className="bg-gunmetal/30 rounded-lg p-4">
              <p className="font-medium text-sm mb-1">📈 Track</p>
              <p className="text-xs text-silver">Track values, market trends, and rarity.</p>
            </div>
            <div className="bg-gunmetal/30 rounded-lg p-4">
              <p className="font-medium text-sm mb-1">🛡️ Protect</p>
              <p className="text-xs text-silver">Keep your collection safe and secure.</p>
            </div>
            <div className="bg-gunmetal/30 rounded-lg p-4">
              <p className="font-medium text-sm mb-1">🤝 Connect</p>
              <p className="text-xs text-silver">Join a community of collectors who share your passion.</p>
            </div>
            <div className="bg-gunmetal/30 rounded-lg p-4">
              <p className="font-medium text-sm mb-1">🚀 Grow Your Legacy</p>
              <p className="text-xs text-silver">Every item has a story. Preserve it and pass it on.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-silver mb-4">Your collection. Your passion. Your universe.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/register" className="btn-primary">Start Collecting</Link>
            <Link href="/collectibles" className="btn-secondary">Explore the Collectiverse</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
