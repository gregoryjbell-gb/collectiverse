import Link from 'next/link';

export default function SellingHelpPage() {
  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/help" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Help Center</Link>
        <h1 className="text-2xl font-bold mb-4">Selling &amp; Marketplace</h1>
        <div className="prose prose-invert max-w-none text-silver space-y-4">
          <p>A sale in Collectiverse connects your listing, payment, shipment, ownership transfer, and feedback in one guided workflow.</p>
          <h2 className="text-lg font-semibold text-white">Sale Lifecycle</h2>
          <ol className="list-decimal list-inside space-y-1"><li>Create a listing from your inventory</li><li>Buyer makes offer or clicks Buy Now</li><li>Payment is marked or processed</li><li>You ship the item with tracking</li><li>Buyer confirms delivery</li><li>Ownership transfers</li><li>Both parties leave feedback</li><li>Sale complete</li></ol>
          <h2 className="text-lg font-semibold text-white">External Sales</h2>
          <p>Sold on eBay, COMC, or at a card show? <Link href="/sales/manual" className="text-electric">Record it here</Link> to keep your inventory and profit/loss accurate.</p>
        </div>
      </div>
    </main>
  );
}
