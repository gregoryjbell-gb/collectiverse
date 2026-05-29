import Link from 'next/link';

export default function GettingStartedPage() {
  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/help" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Help Center</Link>
        <h1 className="text-2xl font-bold mb-4">Getting Started</h1>
        <div className="prose prose-invert max-w-none text-silver space-y-4">
          <p>Welcome to Collectiverse! Here's how to get started:</p>
          <h2 className="text-lg font-semibold text-white">1. Create Your Account</h2>
          <p>Register for free to start tracking your collection. Every new user gets the Explorer plan with 500 inventory slots.</p>
          <h2 className="text-lg font-semibold text-white">2. Add Your First Collectible</h2>
          <p>Go to <Link href="/inventory/add/select-type" className="text-electric">Add Collectible</Link> and choose your type: sports card, comic, sealed product, memorabilia, coin, video game, toy, or music.</p>
          <h2 className="text-lg font-semibold text-white">3. Import Your Collection</h2>
          <p>Already tracking elsewhere? <Link href="/inventory/import" className="text-electric">Import from CSV</Link> — we support Ludex, Collectr, CollX, Cardly AI, and generic spreadsheets.</p>
          <h2 className="text-lg font-semibold text-white">4. Explore</h2>
          <p>Browse the <Link href="/marketplace" className="text-electric">Marketplace</Link>, join <Link href="/live" className="text-electric">Live Events</Link>, or check out <Link href="/collectibles" className="text-electric">the catalog</Link>.</p>
        </div>
      </div>
    </main>
  );
}
