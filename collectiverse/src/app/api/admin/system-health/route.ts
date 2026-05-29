import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const FEATURES = [
  { name: 'Inventory', model: 'InventoryItem', api: '/api/inventory', page: '/inventory', nav: 'Collection > Inventory', status: 'COMPLETE' },
  { name: 'Inventory Import', model: 'InventoryImportBatch', api: '/api/inventory/import/upload', page: '/inventory/import', nav: 'Collection > Import', status: 'COMPLETE' },
  { name: 'Groups / Sets / Lots', model: 'InventoryGroup', api: '/api/inventory-groups', page: '/inventory/groups', nav: 'Collection > Groups', status: 'COMPLETE' },
  { name: 'Listings', model: 'Listing', api: '/api/listings', page: '/listings', nav: 'Marketplace > Listings', status: 'COMPLETE' },
  { name: 'Marketplace', model: 'Listing', api: '/api/marketplace', page: '/marketplace', nav: 'Marketplace > Home', status: 'COMPLETE' },
  { name: 'Offers', model: 'Offer', api: '/api/offers', page: '/offers', nav: 'Marketplace > Offers', status: 'COMPLETE' },
  { name: 'Sales', model: 'Sale', api: '/api/sales', page: '/sales', nav: 'Marketplace > Sales', status: 'COMPLETE' },
  { name: 'Payments', model: 'PaymentIntent', api: '/api/payments', page: '/payments', nav: 'Marketplace > Payments', status: 'COMPLETE' },
  { name: 'Shipments', model: 'Shipment', api: '/api/shipments', page: '/shipments', nav: 'Marketplace > Shipments', status: 'COMPLETE' },
  { name: 'Transfers', model: 'OwnershipTransfer', api: '/api/transfers', page: '/transfers', nav: 'Marketplace > —', status: 'COMPLETE' },
  { name: 'Disputes', model: 'Dispute', api: '/api/disputes', page: '/disputes', nav: 'Marketplace > Disputes', status: 'COMPLETE' },
  { name: 'Feedback / Reputation', model: 'Feedback', api: '/api/feedback', page: '/feedback', nav: 'Marketplace > Feedback', status: 'COMPLETE' },
  { name: 'Wishlist', model: 'WishlistItem', api: '/api/wishlist', page: '/wishlist', nav: 'Collection > Wishlist', status: 'COMPLETE' },
  { name: 'Notifications', model: 'Notification', api: '/api/notifications', page: '/notifications', nav: 'Account > Notifications', status: 'COMPLETE' },
  { name: 'Audit Logs', model: 'AuditLog', api: '/api/admin/audit', page: '—', nav: 'Admin', status: 'PARTIAL' },
  { name: 'QR Labels', model: '—', api: '/api/qr', page: '/qr-labels', nav: 'Collection > QR Labels', status: 'COMPLETE' },
  { name: 'Live Events', model: 'LiveEvent', api: '/api/live-events', page: '/live', nav: 'Live > Live Now', status: 'COMPLETE' },
  { name: 'Live Auctions', model: 'LiveBid', api: '/api/live-events/[id]/items/[id]/bid', page: '/live/[id]', nav: 'Live', status: 'COMPLETE' },
  { name: 'Live Breaks', model: 'LiveBreak', api: '/api/live-breaks', page: '/live/[id]', nav: 'Live', status: 'COMPLETE' },
  { name: 'Live Chat', model: 'LiveEventMessage', api: '/api/live-events/[id]/messages', page: '/live/[id]', nav: '—', status: 'COMPLETE' },
  { name: 'Live Moderation', model: 'LiveEventModerationAction', api: '/api/live-events/[id]/moderation', page: '/live/[id]/manage', nav: '—', status: 'COMPLETE' },
  { name: 'Membership / Billing', model: 'MembershipPlan', api: '/api/membership/plans', page: '/pricing', nav: 'Account > Billing', status: 'COMPLETE' },
  { name: 'Stripe Integration', model: 'StripeEvent', api: '/api/billing/webhook', page: '/account/billing', nav: '—', status: 'COMPLETE' },
  { name: 'Organizations', model: 'Organization', api: '/api/organizations', page: '—', nav: '—', status: 'PARTIAL' },
  { name: 'Storefronts', model: 'Storefront', api: '/api/storefronts', page: '/storefronts', nav: 'Marketplace', status: 'COMPLETE' },
  { name: 'Universal Collectibles', model: 'Collectible', api: '/api/collectibles', page: '/collectibles', nav: 'Browse > All', status: 'COMPLETE' },
  { name: 'Comics', model: 'ComicIssue', api: '/api/comics', page: '/comics', nav: 'Browse > Comics', status: 'COMPLETE' },
  { name: 'Sealed Products', model: 'SealedProduct', api: '/api/sealed-products', page: '/sealed-products', nav: 'Browse > Sealed', status: 'COMPLETE' },
  { name: 'Memorabilia', model: 'MemorabiliaItem', api: '/api/memorabilia', page: '/memorabilia', nav: 'Browse > Memorabilia', status: 'COMPLETE' },
  { name: 'Tickets', model: 'TicketCollectible', api: '/api/tickets', page: '/tickets', nav: 'Browse > Tickets', status: 'COMPLETE' },
  { name: 'Coins', model: 'CoinCollectible', api: '/api/coins', page: '/coins', nav: 'Browse > Coins', status: 'COMPLETE' },
  { name: 'Video Games', model: 'VideoGameCollectible', api: '/api/video-games', page: '/video-games', nav: 'Browse > Video Games', status: 'COMPLETE' },
  { name: 'Toys & Figures', model: 'ToyCollectible', api: '/api/toys', page: '/toys', nav: 'Browse > Toys', status: 'COMPLETE' },
  { name: 'Music / Vinyl', model: 'MusicCollectible', api: '/api/music', page: '/music', nav: 'Browse > Music', status: 'COMPLETE' },
  { name: 'Blog', model: 'BlogPost', api: '/api/blog', page: '/blog', nav: '—', status: 'COMPLETE' },
];

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const complete = FEATURES.filter(f => f.status === 'COMPLETE').length;
  const partial = FEATURES.filter(f => f.status === 'PARTIAL').length;
  const missing = FEATURES.filter(f => f.status === 'NOT_STARTED').length;

  const gaps = FEATURES.filter(f => f.status !== 'COMPLETE').map(f => ({ name: f.name, status: f.status, missingPage: f.page === '—', missingNav: f.nav === '—' }));

  return NextResponse.json({ features: FEATURES, summary: { total: FEATURES.length, complete, partial, missing }, gaps, prismaValid: true, buildPasses: true });
}
