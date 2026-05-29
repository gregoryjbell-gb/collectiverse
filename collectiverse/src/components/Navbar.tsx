'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const publicLinks = [
  { href: '/', label: 'Home' },
  { href: '/cards', label: 'Cards' },
  { href: '/sets', label: 'Sets / Checklists' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/search', label: 'Search' },
];

const collectionLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/inventory', label: 'My Collection' },
  { href: '/inventory/groups', label: 'Groups / Sets / Lots' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/qr-labels', label: 'QR Labels' },
];

const sellingLinks = [
  { href: '/listings', label: 'Listings' },
  { href: '/offers', label: 'Offers' },
  { href: '/sales', label: 'Sales' },
  { href: '/sales/manual', label: 'Record External Sale' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/transfers', label: 'Transfers' },
  { href: '/shipments', label: 'Shipments' },
  { href: '/payments', label: 'Payments' },
];

const trustLinks = [
  { href: '/notifications', label: 'Notifications' },
  { href: '/disputes', label: 'Disputes' },
  { href: '/feedback', label: 'Feedback / Reputation' },
  { href: '/activity', label: 'Account Activity' },
  { href: '/account/shipping-addresses', label: 'Shipping Addresses' },
  { href: '/account', label: 'Account' },
];

const adminLinks = [
  { href: '/admin', label: 'Admin Dashboard' },
  { href: '/admin?tab=cards', label: 'Card Review' },
  { href: '/admin?tab=images', label: 'Image Review' },
  { href: '/admin?tab=duplicates', label: 'Duplicate Review' },
  { href: '/admin?tab=reports', label: 'Reports' },
  { href: '/admin?tab=users', label: 'Users' },
  { href: '/admin?tab=disputes', label: 'Disputes' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ username?: string; displayName?: string; role?: string } | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.user) setUser(d.user); })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.includes('?')) return pathname === href.split('?')[0];
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(href) ? 'bg-electric/15 text-electric' : 'text-silver hover:text-white hover:bg-silver/5'}`;

  const mobileLinkClass = (href: string) =>
    `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(href) ? 'bg-electric/15 text-electric' : 'text-silver hover:text-white hover:bg-silver/5'}`;

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-md border-b border-silver/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-electric tracking-tight hover:opacity-90 transition-opacity">
          Collectiverse
        </Link>

        {/* Desktop: Public links */}
        <div className="hidden lg:flex items-center gap-1">
          {publicLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>{link.label}</Link>
          ))}
        </div>

        {/* Desktop: Right side */}
        <div className="hidden lg:flex items-center gap-2" ref={dropdownRef}>
          {user ? (
            <>
              {/* Collection Dropdown */}
              <NavDropdown
                label="Collection"
                links={collectionLinks}
                isOpen={openDropdown === 'collection'}
                onToggle={() => toggleDropdown('collection')}
                isActive={collectionLinks.some(l => isActive(l.href))}
                onNavigate={() => setOpenDropdown(null)}
              />

              {/* Selling Dropdown */}
              <NavDropdown
                label="Selling"
                links={sellingLinks}
                isOpen={openDropdown === 'selling'}
                onToggle={() => toggleDropdown('selling')}
                isActive={sellingLinks.some(l => isActive(l.href))}
                onNavigate={() => setOpenDropdown(null)}
              />

              {/* Trust & Support Dropdown */}
              <NavDropdown
                label="Trust"
                links={trustLinks}
                isOpen={openDropdown === 'trust'}
                onToggle={() => toggleDropdown('trust')}
                isActive={trustLinks.some(l => isActive(l.href))}
                onNavigate={() => setOpenDropdown(null)}
              />

              {/* Admin Dropdown */}
              {user.role === 'ADMIN' && (
                <NavDropdown
                  label="Admin"
                  links={adminLinks}
                  isOpen={openDropdown === 'admin'}
                  onToggle={() => toggleDropdown('admin')}
                  isActive={pathname.startsWith('/admin')}
                  onNavigate={() => setOpenDropdown(null)}
                />
              )}

              <Link href="/notifications" className={linkClass('/notifications')} title="Notifications">🔔</Link>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gunmetal/50 border border-silver/10">
                <span className="text-xs text-white font-medium">{user.displayName || user.username}</span>
              </div>
              <button onClick={handleLogout} className="px-3 py-2 rounded-lg text-sm font-medium text-silver hover:text-white hover:bg-silver/5 transition-colors">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass('/login')}>Sign In</Link>
              <Link href="/register" className="btn-primary text-sm px-4 py-2">Register</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-silver hover:text-white" aria-label="Toggle menu" aria-expanded={mobileOpen}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-navy border-t border-silver/10 px-6 py-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-0.5">
            <p className="text-xs text-silver uppercase tracking-wider px-4 py-1">Browse</p>
            {publicLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={mobileLinkClass(link.href)}>{link.label}</Link>
            ))}
          </div>

          {user && (
            <>
              <div className="border-t border-silver/10 pt-3 mt-3 space-y-0.5">
                <p className="text-xs text-silver uppercase tracking-wider px-4 py-1">Collection</p>
                {collectionLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={mobileLinkClass(link.href)}>{link.label}</Link>
                ))}
              </div>

              <div className="border-t border-silver/10 pt-3 mt-3 space-y-0.5">
                <p className="text-xs text-silver uppercase tracking-wider px-4 py-1">Selling</p>
                {sellingLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={mobileLinkClass(link.href)}>{link.label}</Link>
                ))}
              </div>

              <div className="border-t border-silver/10 pt-3 mt-3 space-y-0.5">
                <p className="text-xs text-silver uppercase tracking-wider px-4 py-1">Trust &amp; Support</p>
                {trustLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={mobileLinkClass(link.href)}>{link.label}</Link>
                ))}
              </div>
            </>
          )}

          {user?.role === 'ADMIN' && (
            <div className="border-t border-silver/10 pt-3 mt-3 space-y-0.5">
              <p className="text-xs text-silver uppercase tracking-wider px-4 py-1">Admin</p>
              {adminLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={mobileLinkClass(link.href)}>{link.label}</Link>
              ))}
            </div>
          )}

          <div className="border-t border-silver/10 pt-3 mt-3">
            {user ? (
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 px-4 py-2">
                  <span className="text-sm text-white font-medium">{user.displayName || user.username}</span>
                  <span className="badge bg-electric/20 text-electric text-xs">{user.role}</span>
                </div>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-silver hover:text-white hover:bg-silver/5">Logout</button>
              </div>
            ) : (
              <div className="space-y-0.5">
                <Link href="/login" onClick={() => setMobileOpen(false)} className={mobileLinkClass('/login')}>Sign In</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-electric hover:bg-silver/5">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavDropdown({ label, links, isOpen, onToggle, isActive, onNavigate }: {
  label: string;
  links: { href: string; label: string }[];
  isOpen: boolean;
  onToggle: () => void;
  isActive: boolean;
  onNavigate: () => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${isActive ? 'bg-electric/15 text-electric' : 'text-silver hover:text-white hover:bg-silver/5'}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-52 bg-navy border border-silver/15 rounded-xl shadow-xl py-2 z-50">
          {links.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              onClick={onNavigate}
              className="block px-4 py-2 text-sm text-silver hover:text-white hover:bg-silver/5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
