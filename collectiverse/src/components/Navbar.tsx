'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const publicLinks = [
  { href: '/', label: 'Home' },
  { href: '/cards', label: 'Cards' },
  { href: '/sets', label: 'Sets' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/search', label: 'Search' },
];

const userLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/inventory/groups', label: 'Groups / Lots' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/listings', label: 'Listings' },
  { href: '/offers', label: 'Offers' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/qr-labels', label: 'QR Labels' },
  { href: '/shipments', label: 'Shipments' },
  { href: '/payments', label: 'Payments' },
  { href: '/disputes', label: 'Disputes' },
  { href: '/account', label: 'Account' },
];

const adminLinks = [
  { href: '/admin', label: 'Admin' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ username?: string; displayName?: string; role?: string } | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.user) setUser(d.user); })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(href) ? 'bg-electric/15 text-electric' : 'text-silver hover:text-white hover:bg-silver/5'}`;
  const mobileLinkClass = (href: string) => `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(href) ? 'bg-electric/15 text-electric' : 'text-silver hover:text-white hover:bg-silver/5'}`;

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
        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className={linkClass('/dashboard')}>Collection</Link>
              <Link href="/notifications" className={linkClass('/notifications')}>🔔</Link>
              {user.role === 'ADMIN' && <Link href="/admin" className={linkClass('/admin')}>Admin</Link>}
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
            <div className="border-t border-silver/10 pt-3 mt-3 space-y-0.5">
              <p className="text-xs text-silver uppercase tracking-wider px-4 py-1">My Collection</p>
              {userLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={mobileLinkClass(link.href)}>{link.label}</Link>
              ))}
            </div>
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
