import { prisma } from './prisma';

const DEFAULT_LIMITS = { inventoryLimit: 500, listingLimit: 10, storageLimitGb: 1 };

export async function getUserMembership(userId: string) {
  const sub = await (prisma as any).userSubscription.findFirst({
    where: { userId, status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] } },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
  return sub;
}

export async function hasFeature(userId: string, featureKey: string): Promise<boolean> {
  const sub = await getUserMembership(userId);
  const plan = sub?.plan;

  // Check if trial is still active
  if (sub?.status === 'TRIAL' && sub.trialEndsAt && new Date() > new Date(sub.trialEndsAt)) return false;

  // Check grace period for PAST_DUE
  if (sub?.status === 'PAST_DUE') {
    if (sub.gracePeriodEndsAt && new Date() > new Date(sub.gracePeriodEndsAt)) return false;
    // Still in grace period — allow access
  }

  // Check subscription limit exceptions
  const exception = await (prisma as any).subscriptionLimitException.findFirst({
    where: { userId, featureKey, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
  });
  if (exception) return true;

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
  const sub = await getUserMembership(userId);
  const plan = sub?.plan;
  return {
    inventoryLimit: plan?.inventoryLimit || DEFAULT_LIMITS.inventoryLimit,
    listingLimit: plan?.listingLimit || DEFAULT_LIMITS.listingLimit,
    storageLimitGb: plan?.storageLimitGb || DEFAULT_LIMITS.storageLimitGb,
    planName: plan?.name || 'Explorer',
    tier: plan?.tier || 'EXPLORER',
    status: sub?.status || 'ACTIVE',
    trialEndsAt: sub?.trialEndsAt || null,
    gracePeriodEndsAt: sub?.gracePeriodEndsAt || null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd || false,
    currentPeriodEnd: sub?.currentPeriodEnd || null,
  };
}

export async function enforceInventoryLimit(userId: string): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
  const limits = await getPlanLimits(userId);
  const current = await (prisma as any).inventoryItem.count({ where: { userId } });
  if (current >= limits.inventoryLimit) {
    return { allowed: false, current, limit: limits.inventoryLimit, message: `You've reached your ${limits.planName} inventory limit (${limits.inventoryLimit}). Upgrade to Collector for unlimited inventory.` };
  }
  return { allowed: true, current, limit: limits.inventoryLimit };
}

export async function enforceListingLimit(userId: string): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
  const limits = await getPlanLimits(userId);
  const current = await (prisma as any).listing.count({ where: { userId, status: { in: ['ACTIVE', 'DRAFT'] } } });
  if (current >= limits.listingLimit) {
    return { allowed: false, current, limit: limits.listingLimit, message: `You've reached your active listing limit (${limits.listingLimit}). Upgrade to Collector for unlimited listings.` };
  }
  return { allowed: true, current, limit: limits.listingLimit };
}

export async function requireFeature(userId: string, featureKey: string): Promise<{ allowed: boolean; message?: string }> {
  const has = await hasFeature(userId, featureKey);
  if (has) return { allowed: true };
  const messages: Record<string, string> = {
    INVENTORY_IMPORT: 'Inventory import is available with Collector and Dealer plans.',
    INVENTORY_EXPORT: 'Inventory export is available with Collector and Dealer plans.',
    ADVANCED_ANALYTICS: 'Advanced analytics is available with Collector and Dealer plans.',
    LIVE_HOSTING: 'Live event hosting is available with Dealer membership.',
    LIVE_AUCTIONS: 'Live auctions are available with Dealer membership.',
    LIVE_BREAKS: 'Live breaks are available with Dealer membership.',
    STOREFRONT: 'Storefronts are available with Dealer membership.',
    API_ACCESS: 'API access is available with Collector and Dealer plans.',
  };
  return { allowed: false, message: messages[featureKey] || 'This feature requires an upgraded plan.' };
}

export async function getSubscriptionStatus(userId: string) {
  const sub = await getUserMembership(userId);
  if (!sub) return { status: 'FREE', warnings: [] };

  const warnings: string[] = [];
  const now = new Date();

  if (sub.status === 'TRIAL' && sub.trialEndsAt) {
    const daysLeft = Math.ceil((new Date(sub.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3) warnings.push(`Trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Add payment to keep your features.`);
  }

  if (sub.status === 'PAST_DUE') {
    warnings.push('Payment issue detected. Update your billing to keep your features.');
    if (sub.gracePeriodEndsAt) {
      const daysLeft = Math.ceil((new Date(sub.gracePeriodEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft > 0) warnings.push(`Grace period: ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining.`);
    }
  }

  if (sub.cancelAtPeriodEnd && sub.currentPeriodEnd) {
    warnings.push(`Your plan will downgrade on ${new Date(sub.currentPeriodEnd).toLocaleDateString()}.`);
  }

  return { status: sub.status, plan: sub.plan?.name, tier: sub.plan?.tier, warnings };
}
