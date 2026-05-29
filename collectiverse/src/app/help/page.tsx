import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Help — Collectiverse', description: 'Learn how to use Collectiverse to manage your collection.' };

const GUIDES = [
  { href: '/help/getting-started', title: 'Getting Started', desc: 'Create your account, add your first collectible, and explore the platform.' },
  { href: '/help/import-inventory', title: 'Import Inventory', desc: 'Upload your collection from Ludex, Collectr, CollX, Cardly AI, or CSV.' },
  { href: '/help/selling', title: 'Selling & Marketplace', desc: 'List items, accept offers, manage sales, and ship to buyers.' },
  { href: '/help/live', title: 'Collectiverse Live', desc: 'Host live sales, auctions, claim sales, and breaks.' },
  { href: '/help/membership', title: 'Membership & Billing', desc: 'Understand Explorer, Collector, and Dealer plans.' },
  { href: '/atlas', title: 'Meet Atlas', desc: 'Learn about Atlas, your guide through the Collectiverse.' },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Help Center</h1>
        <p className="text-silver mb-8">Everything you need to know about using Collectiverse.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {GUIDES.map(g => (
            <Link key={g.href} href={g.href} className="card-surface p-5 hover:border-electric/30 transition-colors">
              <p className="font-medium text-sm">{g.title}</p>
              <p className="text-xs text-silver mt-1">{g.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
