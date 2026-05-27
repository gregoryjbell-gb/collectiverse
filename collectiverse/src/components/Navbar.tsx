'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/cards', label: 'Cards' },
  { href: '/players', label: 'Players' },
  { href: '/sets', label: 'Sets' },
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy/95 backdrop-blur-md border-b border-silver/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="text-xl font-bold text-electric tracking-tight hover:opacity-90 transition-opacity">
          Collectiverse
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-electric/15 text-electric'
                  : 'text-silver hover:text-white hover:bg-silver/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gunmetal/50 border border-silver/10">
                <span className="text-sm text-white font-medium">{user.displayName || user.username}</span>
                <span className="badge bg-electric/20 text-electric text-xs">{user.role}</span>
              </div>
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/dashboard') || pathname.startsWith('/inventory')
                    ? 'bg-electric/15 text-electric'
                    : 'text-silver hover:text-white hover:bg-silver/5'
                }`}
              >
                My Collection
              </Link>
              {(user.role === 'ADMIN') && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin')
                      ? 'bg-electric/15 text-electric'
                      : 'text-silver hover:text-white hover:bg-silver/5'
                  }`}
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg text-sm font-medium text-silver hover:text-white hover:bg-silver/5 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/login'
                    ? 'bg-electric/15 text-electric'
                    : 'text-silver hover:text-white hover:bg-silver/5'
                }`}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-primary text-sm px-4 py-2"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-silver hover:text-white"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-navy border-t border-silver/10 px-6 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-electric/15 text-electric'
                  : 'text-silver hover:text-white hover:bg-silver/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-silver/10 pt-3 mt-3 space-y-1">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2">
                  <span className="text-sm text-white font-medium">{user.displayName || user.username}</span>
                  <span className="badge bg-electric/20 text-electric text-xs">{user.role}</span>
                </div>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-silver hover:text-white hover:bg-silver/5">
                  My Collection
                </Link>
                <Link href="/inventory" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-silver hover:text-white hover:bg-silver/5">
                  Inventory
                </Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-silver hover:text-white hover:bg-silver/5">
                    Admin
                  </Link>
                )}
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-silver hover:text-white hover:bg-silver/5">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-silver hover:text-white hover:bg-silver/5">
                  Sign In
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-electric hover:bg-silver/5">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
