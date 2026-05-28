import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  const type = req.nextUrl.searchParams.get('type') || 'ALL';
  if (!q || q.length < 2) return NextResponse.json({ query: q, sections: [], total: 0 });

  const session = await getSession();
  let userId: string | null = null;
  try { if (session) userId = await ensureUserId(session); } catch {}

  const sections: any[] = [];
  const searchTypes = type === 'ALL' ? ['CARDS', 'SETS', 'LISTINGS', 'INVENTORY', 'GROUPS', 'WISHLIST', 'USERS'] : [type];

  // Public: Cards
  if (searchTypes.includes('CARDS')) {
    const cards = await prisma.card.findMany({
      where: { OR: [{ person: { displayName: { contains: q, mode: 'insensitive' } } }, { set: { name: { contains: q, mode: 'insensitive' } } }, { cardNumber: { contains: q } }] },
      include: { person: { select: { displayName: true } }, set: { select: { name: true, year: true } } },
      take: 5,
    });
    if (cards.length > 0) sections.push({ type: 'CARDS', items: cards.map(c => ({ id: c.id, title: c.person?.displayName || 'Card', subtitle: `${c.set?.name} #${c.cardNumber} (${c.year || c.set?.year})`, href: `/cards/${c.id}` })) });
  }

  // Public: Sets
  if (searchTypes.includes('SETS')) {
    const sets = await prisma.cardSet.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      take: 5,
    });
    if (sets.length > 0) sections.push({ type: 'SETS', items: sets.map(s => ({ id: s.id, title: s.name, subtitle: `${s.year} • ${s.manufacturer || ''}`, href: `/sets/${s.id}` })) });
  }

  // Public: Active Listings
  if (searchTypes.includes('LISTINGS')) {
    const listings = await (prisma as any).listing.findMany({
      where: { status: 'ACTIVE', description: { contains: q, mode: 'insensitive' } },
      take: 5,
    });
    if (listings.length > 0) sections.push({ type: 'LISTINGS', items: listings.map((l: any) => ({ id: l.id, title: `Listing $${l.price || '?'}`, subtitle: l.description?.slice(0, 60) || '', href: `/marketplace/${l.id}`, badge: 'FOR SALE' })) });
  }

  // Public: Users/Sellers
  if (searchTypes.includes('USERS')) {
    const users = await prisma.user.findMany({
      where: { OR: [{ displayName: { contains: q, mode: 'insensitive' } }, { username: { contains: q, mode: 'insensitive' } }] },
      select: { id: true, displayName: true, username: true },
      take: 5,
    });
    if (users.length > 0) sections.push({ type: 'USERS', items: users.map(u => ({ id: u.id, title: u.displayName || u.username || '', subtitle: u.username ? `@${u.username}` : '', href: `/profile/${u.id}` })) });
  }

  // Private: Inventory (logged-in user only)
  if (searchTypes.includes('INVENTORY') && userId) {
    const items = await prisma.inventoryItem.findMany({
      where: { userId, card: { OR: [{ person: { displayName: { contains: q, mode: 'insensitive' } } }, { set: { name: { contains: q, mode: 'insensitive' } } }, { cardNumber: { contains: q } }] } },
      include: { card: { include: { person: { select: { displayName: true } }, set: { select: { name: true } } } } },
      take: 5,
    });
    if (items.length > 0) sections.push({ type: 'INVENTORY', items: items.map(i => ({ id: i.id, title: i.card.person?.displayName || 'Card', subtitle: `${i.card.set?.name} #${i.card.cardNumber}`, href: `/inventory/${i.id}`, badge: i.status })) });
  }

  // Private: Groups
  if (searchTypes.includes('GROUPS') && userId) {
    const groups = await (prisma as any).inventoryGroup.findMany({
      where: { userId, name: { contains: q, mode: 'insensitive' } },
      take: 5,
    });
    if (groups.length > 0) sections.push({ type: 'GROUPS', items: groups.map((g: any) => ({ id: g.id, title: g.name, subtitle: g.groupType.replace(/_/g, ' '), href: `/inventory/groups/${g.id}` })) });
  }

  // Private: Wishlist
  if (searchTypes.includes('WISHLIST') && userId) {
    const wishlist = await (prisma as any).wishlistItem.findMany({
      where: { userId, OR: [{ collectibleCategory: { contains: q, mode: 'insensitive' } }, { notes: { contains: q, mode: 'insensitive' } }] },
      take: 5,
    });
    if (wishlist.length > 0) sections.push({ type: 'WISHLIST', items: wishlist.map((w: any) => ({ id: w.id, title: w.collectibleCategory || 'Target', subtitle: w.priority, href: `/wishlist` })) });
  }

  const total = sections.reduce((s, sec) => s + sec.items.length, 0);
  return NextResponse.json({ query: q, type, sections, total });
}
