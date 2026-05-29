'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const browseLinks = [
  { href: '/cards', label: 'Cards' },
  { href: '/comics', label: 'Comics' },
  { href: '/sealed-products', label: 'Sealed Products' },
  { href: '/memorabilia', label: 'Memorabilia' },
  { href: '/tickets', label: 'Tickets' },
  { href: '/coins', label: 'Coins' },
  { href: '/video-games', label: 'Video Games' },
  { href: '/toys', label: 'Toys & Figures' },
  { href: '/music', label: 'Music / Vinyl' },
  { href: '/sets', label: 'Sets / Checklists' },
  { href: '/checklists', label: 'Checklists' },
  { href: '/collectibles', label: 'All Collectibles' },
  { href: '/search', label: 'Search' },
];

const collectionLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/inventory/add/select-type', label: 'Add Collectible' },
  { href: '/inventory/import', label: 'Import Inventory' },
  { href: '/inventory/groups', label: 'Groups / Lots / Sets' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/qr-labels', label: 'QR Labels' },
];

const marketplaceLinks = [
  { href: '/marketplace', label: 'Marketplace Home' },
  { href: '/listings', label: 'My Listings' },
  { href: '/offers', label: 'Offers' },
  { href: '/sales', label: 'Sales' },
  { href: '/sales/manual', label: 'Record External Sale' },
  { href: '/shipments', label: 'Shipments' },
  { href: '/payments', label: 'Payments' },
  { href: '/disputes', label: 'Disputes' },
  { href: '/feedback', label: 'Feedback / Reputation' },
];

const liveLinks = [
  { href: '/live', label: 'Live Now' },
  { href: '/live/studio', label: 'Live Studio' },
  { href: '/live/my-activity', label: 'My Live Activity' },
  { href: '/live/create', label: 'Create Live Event' },
];

const accountLinks = [
  { href: '/notifications', label: 'Notifications' },
  { href: '/account', label: 'Profile' },
  { href: '/account/shipping-addresses', label: 'Shipping Addresses' },
  { href: '/activity', label: 'Activity' },
];

const adminLinks = [
  { href: '/admin', label: 'Admin Dashboard' },
  { href: '/admin/import', label: 'Imports' },
  { href: '/admin/import/comics', label: 'Comic Imports' },
  { href: '/admin/import-connectors', label: 'Import Connectors' },
  { href: '/admin/import-jobs', label: 'Import Jobs' },
  { href: '/admin/card-reviews', label: 'Card Reviews' },
  { href: '/admin/duplicates', label: 'Duplicates' },
  { href: '/admin/verification', label: 'Verification' },
  { href: '/admin/card-identities', label: 'Card Identities' },
  { href: '/admin/manufacturers', label: 'Manufacturers' },
  { href: '/admin/brands', label: 'Brands' },
  { href: '/admin?tab=users', label: 'Users' },
  { href: '/admin?tab=reports', label: 'Reports' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ username?: string; displayName?: string; role?: string } | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(d => { if (d?.user) setUser(d.user); }).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpenDropdown(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); router.push('/'); router.refresh(); };
  const isActive = (href: string) => { if (href === '/') return pathname === '/'; if (href.includes('?')) return pathname === href.split('?')[0]; return pathname.startsWith(href); };
  const toggle = (name: string) => setOpenDropdown(openDropdown === name ? null : name);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-md border-b border-silver/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/atlas" className="flex items-center gap-2 hover:opacity-90 transition-opacity" aria-label="Go to Atlas comic strip">
          <img src="/brand/collectiverse-logo.png" alt="Collectiverse" className="h-8 w-auto hidden sm:block" />
          <span className="text-xl font-bold text-electric tracking-tight sm:hidden">Collectiverse</span>
        </Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
          <NavDrop label="Browse" links={browseLinks} isOpen={openDropdown === 'browse'} onToggle={() => toggle('browse')} isActive={browseLinks.some(l => isActive(l.href))} onNav={() => setOpenDropdown(null)} />
          {user && <NavDrop label="Collection" links={collectionLinks} isOpen={openDropdown === 'collection'} onToggle={() => toggle('collection')} isActive={collectionLinks.some(l => isActive(l.href))} onNav={() => setOpenDropdown(null)} />}
          <NavDrop label="Marketplace" links={user ? marketplaceLinks : [{ href: '/marketplace', label: 'Marketplace' }]} isOpen={openDropdown === 'marketplace'} onToggle={() => toggle('marketplace')} isActive={marketplaceLinks.some(l => isActive(l.href))} onNav={() => setOpenDropdown(null)} />
          <NavDrop label="Live" links={user ? liveLinks : [{ href: '/live', label: 'Live Events' }]} isOpen={openDropdown === 'live'} onToggle={() => toggle('live')} isActive={liveLinks.some(l => isActive(l.href))} onNav={() => setOpenDropdown(null)} />
          {user && <NavDrop label="Account" links={accountLinks} isOpen={openDropdown === 'account'} onToggle={() => toggle('account')} isActive={accountLinks.some(l => isActive(l.href))} onNav={() => setOpenDropdown(null)} />}
          {user?.role === 'ADMIN' && <NavDrop label="Admin" links={adminLinks} isOpen={openDropdown === 'admin'} onToggle={() => toggle('admin')} isActive={pathname.startsWith('/admin')} onNav={() => setOpenDropdown(null)} />}
          {user ? (
            <button onClick={handleLogout} className="px-3 py-2 rounded-lg text-sm font-medium text-silver hover:text-white hover:bg-silver/5 transition-colors">Logout</button>
          ) : (
            <><Link href="/login" className="px-3 py-2 rounded-lg text-sm font-medium text-silver hover:text-white">Sign In</Link><Link href="/register" className="btn-primary text-sm px-4 py-2">Register</Link></>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-silver hover:text-white" aria-label="Toggle menu" aria-expanded={mobileOpen}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}</svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-navy border-t border-silver/10 px-6 py-4 max-h-[80vh] overflow-y-auto">
          <MobileSection title="Browse" links={browseLinks} close={() => setMobileOpen(false)} />
          {user && <MobileSection title="My Collection" links={collectionLinks} close={() => setMobileOpen(false)} />}
          <MobileSection title="Marketplace" links={user ? marketplaceLinks : [{ href: '/marketplace', label: 'Marketplace' }]} close={() => setMobileOpen(false)} />
          <MobileSection title="Live" links={user ? liveLinks : [{ href: '/live', label: 'Live Events' }]} close={() => setMobileOpen(false)} />
          {user && <MobileSection title="Account" links={accountLinks} close={() => setMobileOpen(false)} />}
          {user?.role === 'ADMIN' && <MobileSection title="Admin" links={adminLinks} close={() => setMobileOpen(false)} />}
          <div className="border-t border-silver/10 pt-3 mt-3">
            {user ? <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-silver hover:text-white hover:bg-silver/5">Logout</button>
            : <><Link href="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm text-silver hover:text-white">Sign In</Link><Link href="/register" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 text-sm text-electric">Register</Link></>}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavDrop({ label, links, isOpen, onToggle, isActive, onNav }: { label: string; links: { href: string; label: string }[]; isOpen: boolean; onToggle: () => void; isActive: boolean; onNav: () => void }) {
  return (
    <div className="relative">
      <button onClick={onToggle} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${isActive ? 'bg-electric/15 text-electric' : 'text-silver hover:text-white hover:bg-silver/5'}`} aria-expanded={isOpen} aria-haspopup="true">
        {label}<svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-navy border border-silver/15 rounded-xl shadow-xl py-2 z-50 max-h-[70vh] overflow-y-auto">
          {links.map(link => <Link key={link.href + link.label} href={link.href} onClick={onNav} className="block px-4 py-2 text-sm text-silver hover:text-white hover:bg-silver/5 transition-colors">{link.label}</Link>)}
        </div>
      )}
    </div>
  );
}

function MobileSection({ title, links, close }: { title: string; links: { href: string; label: string }[]; close: () => void }) {
  return (
    <div className="border-t border-silver/10 pt-3 mt-3 first:border-0 first:pt-0 first:mt-0 space-y-0.5">
      <p className="text-xs text-silver uppercase tracking-wider px-4 py-1">{title}</p>
      {links.map(link => <Link key={link.href} href={link.href} onClick={close} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-silver hover:text-white hover:bg-silver/5 transition-colors">{link.label}</Link>)}
    </div>
  );
}
