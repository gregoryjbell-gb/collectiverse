import { prisma } from './prisma';

const DEFAULT_LIMITS = { inventoryLimit: 500, listingLimit: 10, storageLimitGb: 1 };

export async function getUserMembership(userId: string) {
  const sub = await (prisma as any).userSubscription.findFirst({
    where: { userId, status: { in: ['ACTIVE', 'TRIAL'] } },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
  return sub?.plan || null;
}

export async function hasFeature(userId: string, featureKey: string): Promise<boolean> {
  const plan = await getUserMembership(userId);
  if (!plan) return false;
  const featureMap: Record<string, string> = {
    UNLIMITED_INVENTORY: 'inventoryLimit',
    UNLIMITED_LISTINGS: 'listingLimit',
    INVENTORY_IMPORT: 'canImportInventory',
    INVENTORY_EXPORT: 'canExportInventory',
    ADVANCED_ANALYTICS: 'canUseAdvancedAnalytics',
    LIVE_HOSTING: 'canHostLiveEvents',
    LIVE_AUCTIONS: 'canHostLiveAuctions',
    LIVE_BREAKS: 'canHostLiveBreaks',
    STOREFRONT: 'canCreateStorefront',
    API_ACCESS: 'canUseApi',
    FEATURED_LISTINGS: 'featuredListingsIncluded',
  };
  const field = featureMap[featureKey];
  if (!field) return false;
  if (field === 'inventoryLimit') return plan.inventoryLimit >= 999999;
  if (field === 'listingLimit') return plan.listingLimit >= 999999;
  if (field === 'featuredListingsIncluded') return plan.featuredListingsIncluded > 0;
  return plan[field] === true;
}

export async function getPlanLimits(userId: string) {
  const plan = await getUserMembership(userId);
  return { inventoryLimit: plan?.inventoryLimit || DEFAULT_LIMITS.inventoryLimit, listingLimit: plan?.listingLimit || DEFAULT_LIMITS.listingLimit, storageLimitGb: plan?.storageLimitGb || DEFAULT_LIMITS.storageLimitGb, planName: plan?.name || 'Explorer', tier: plan?.tier || 'EXPLORER' };
}

export async function enforceInventoryLimit(userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = await getPlanLimits(userId);
  const current = await (prisma as any).inventoryItem.count({ where: { userId } });
  return { allowed: current < limits.inventoryLimit, current, limit: limits.inventoryLimit };
}

export async function enforceListingLimit(userId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = await getPlanLimits(userId);
  const current = await (prisma as any).listing.count({ where: { userId, status: { in: ['ACTIVE', 'DRAFT'] } } });
  return { allowed: current < limits.listingLimit, current, limit: limits.listingLimit };
}

export async function requireFeature(userId: string, featureKey: string): Promise<{ allowed: boolean; message?: string }> {
  const has = await hasFeature(userId, featureKey);
  if (has) return { allowed: true };
  const messages: Record<string, string> = {
    INVENTORY_IMPORT: 'Inventory import is available with Collector and Dealer plans.',
    ADVANCED_ANALYTICS: 'Advanced analytics is available with Collector and Dealer plans.',
    LIVE_HOSTING: 'Live event hosting is available with Dealer membership.',
    LIVE_AUCTIONS: 'Live auctions are available with Dealer membership.',
    LIVE_BREAKS: 'Live breaks are available with Dealer membership.',
    STOREFRONT: 'Storefronts are available with Dealer membership.',
  };
  return { allowed: false, message: messages[featureKey] || 'This feature requires an upgraded plan.' };
}
