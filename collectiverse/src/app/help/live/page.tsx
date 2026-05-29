import Link from 'next/link';

export default function LiveHelpPage() {
  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/help" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Help Center</Link>
        <h1 className="text-2xl font-bold mb-4">Collectiverse Live</h1>
        <div className="prose prose-invert max-w-none text-silver space-y-4">
          <p>Host live sales, auctions, claim sales, and breaks — or join as a buyer to claim items in real time.</p>
          <h2 className="text-lg font-semibold text-white">Event Types</h2>
          <ul className="list-disc list-inside"><li>Live Sale — present items, buyers claim</li><li>Auction — timed bidding</li><li>Claim Sale — first to claim wins</li><li>Break — sell spots, randomize teams, open product live</li><li>Showcase — display collection without selling</li></ul>
          <h2 className="text-lg font-semibold text-white">For Sellers</h2>
          <p>Use the <Link href="/live/studio" className="text-electric">Live Studio</Link> to manage events, accept claims, and track fulfillment.</p>
          <h2 className="text-lg font-semibold text-white">For Buyers</h2>
          <p>Check <Link href="/live/my-activity" className="text-electric">My Live Activity</Link> to track your claims, bids, and break spots.</p>
        </div>
      </div>
    </main>
  );
}
