import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-silver/10 mt-16 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 text-xs">
        <div>
          <p className="font-semibold text-white mb-3">Collectiverse</p>
          <div className="space-y-1.5 text-silver">
            <Link href="/about" className="block hover:text-white">About</Link>
            <Link href="/help" className="block hover:text-white">Help</Link>
            <Link href="/contact" className="block hover:text-white">Contact</Link>
            <Link href="/atlas" className="block hover:text-white">Atlas</Link>
            <Link href="/pricing" className="block hover:text-white">Pricing</Link>
            <Link href="/blog" className="block hover:text-white">Blog</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-white mb-3">Browse</p>
          <div className="space-y-1.5 text-silver">
            <Link href="/cards" className="block hover:text-white">Cards</Link>
            <Link href="/comics" className="block hover:text-white">Comics</Link>
            <Link href="/sealed-products" className="block hover:text-white">Sealed Products</Link>
            <Link href="/memorabilia" className="block hover:text-white">Memorabilia</Link>
            <Link href="/marketplace" className="block hover:text-white">Marketplace</Link>
            <Link href="/live" className="block hover:text-white">Live</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-white mb-3">Sellers</p>
          <div className="space-y-1.5 text-silver">
            <Link href="/listings/add" className="block hover:text-white">Create Listing</Link>
            <Link href="/storefronts" className="block hover:text-white">Storefronts</Link>
            <Link href="/live/studio" className="block hover:text-white">Live Studio</Link>
            <Link href="/seller-policy" className="block hover:text-white">Seller Policy</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-white mb-3">Trust & Safety</p>
          <div className="space-y-1.5 text-silver">
            <Link href="/buyer-protection" className="block hover:text-white">Buyer Protection</Link>
            <Link href="/community-guidelines" className="block hover:text-white">Guidelines</Link>
            <Link href="/copyright" className="block hover:text-white">Copyright</Link>
            <Link href="/data-sources" className="block hover:text-white">Data Sources</Link>
            <Link href="/report" className="block hover:text-white">Report Content</Link>
          </div>
        </div>
        <div>
          <p className="font-semibold text-white mb-3">Legal</p>
          <div className="space-y-1.5 text-silver">
            <Link href="/terms" className="block hover:text-white">Terms of Service</Link>
            <Link href="/privacy" className="block hover:text-white">Privacy Policy</Link>
            <Link href="/copyright" className="block hover:text-white">Copyright Policy</Link>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-silver/10 text-center text-xs text-silver">
        <p>© {new Date().getFullYear()} Collectiverse. All rights reserved.</p>
      </div>
    </footer>
  );
}
