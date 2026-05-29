'use client';

import Link from 'next/link';

const TYPES = [
  { type: 'SPORTS_CARD', label: 'Sports Card', desc: 'Football, basketball, baseball, hockey, soccer cards', icon: '🏈', href: '/inventory/add' },
  { type: 'TCG_CARD', label: 'TCG Card', desc: 'Pokémon, Magic, Yu-Gi-Oh, and other trading card games', icon: '🎴', href: '/inventory/add?type=TCG_CARD' },
  { type: 'NON_SPORTS_CARD', label: 'Non-Sports Card', desc: 'Entertainment, movie, TV, music, and celebrity cards', icon: '🎬', href: '/inventory/add?type=NON_SPORTS_CARD' },
  { type: 'COMIC_BOOK', label: 'Comic Book', desc: 'Single issues, variants, key issues, and graded comics', icon: '📚', href: '/inventory/add-comic' },
  { type: 'SEALED_PRODUCT', label: 'Sealed Product', desc: 'Boxes, packs, cases, and sealed hobby products', icon: '📦', href: '/inventory/groups/add?type=SEALED_PRODUCT' },
  { type: 'MEMORABILIA', label: 'Memorabilia', desc: 'Autographed items, game-used gear, and authenticated pieces', icon: '🏆', href: '/inventory/add?type=MEMORABILIA' },
  { type: 'COIN', label: 'Coin / Currency', desc: 'Graded coins, currency, and bullion', icon: '🪙', href: '/inventory/add?type=COIN' },
  { type: 'VIDEO_GAME', label: 'Video Game', desc: 'Graded games, sealed games, and retro gaming', icon: '🎮', href: '/inventory/add?type=VIDEO_GAME' },
  { type: 'OTHER', label: 'Other Collectible', desc: 'Tickets, figures, vinyl, and anything else', icon: '📋', href: '/inventory/add?type=OTHER' },
];

export default function SelectTypePage() {
  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/inventory" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back to Inventory</Link>
        <h1 className="text-2xl font-bold mb-2">Add to Collection</h1>
        <p className="text-silver text-sm mb-6">What type of collectible are you adding?</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TYPES.map(t => (
            <Link key={t.type} href={t.href} className="card-surface p-5 hover:border-electric/30 transition-colors group">
              <span className="text-2xl mb-2 block">{t.icon}</span>
              <p className="font-medium text-sm group-hover:text-electric transition-colors">{t.label}</p>
              <p className="text-xs text-silver mt-1">{t.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
