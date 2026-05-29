import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { getPlanLimits, hasFeature } from '@/lib/membership';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [inventoryCount, listingCount, liveEventsCount, importsCount] = await Promise.all([
    (prisma as any).inventoryItem.count({ where: { userId } }),
    (prisma as any).listing.count({ where: { userId, status: { in: ['ACTIVE', 'DRAFT'] } } }),
    (prisma as any).liveEvent.count({ where: { sellerUserId: userId, createdAt: { gte: monthStart } } }),
    (prisma as any).inventoryImportBatch.count({ where: { userId, createdAt: { gte: monthStart } } }),
  ]);

  const limits = await getPlanLimits(userId);

  const features = {
    import: await hasFeature(userId, 'INVENTORY_IMPORT'),
    export: await hasFeature(userId, 'INVENTORY_EXPORT'),
    analytics: await hasFeature(userId, 'ADVANCED_ANALYTICS'),
    liveHosting: await hasFeature(userId, 'LIVE_HOSTING'),
    liveAuctions: await hasFeature(userId, 'LIVE_AUCTIONS'),
    liveBreaks: await hasFeature(userId, 'LIVE_BREAKS'),
    storefront: await hasFeature(userId, 'STOREFRONT'),
  };

  return NextResponse.json({
    usage: { inventoryCount, listingCount, liveEventsCount, importsCount, storageUsedBytes: 0 },
    limits: { inventoryLimit: limits.inventoryLimit, listingLimit: limits.listingLimit, storageLimitGb: limits.storageLimitGb },
    plan: { name: limits.planName, tier: limits.tier, status: limits.status, trialEndsAt: limits.trialEndsAt, cancelAtPeriodEnd: limits.cancelAtPeriodEnd, currentPeriodEnd: limits.currentPeriodEnd },
    features,
  });
}
