import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SEED_PLANS = [
  { name: 'Explorer', tier: 'EXPLORER', description: 'For casual collectors', monthlyPrice: 0, yearlyPrice: 0, inventoryLimit: 500, listingLimit: 10, storageLimitGb: 1, canImportInventory: false, canExportInventory: false, canUseAdvancedAnalytics: false, canHostLiveEvents: false, canHostLiveAuctions: false, canHostLiveBreaks: false, canCreateStorefront: false, canUseApi: false, featuredListingsIncluded: 0 },
  { name: 'Collector', tier: 'COLLECTOR', description: 'For serious collectors', monthlyPrice: 9.99, yearlyPrice: 99, inventoryLimit: 999999, listingLimit: 999999, storageLimitGb: 25, canImportInventory: true, canExportInventory: true, canUseAdvancedAnalytics: true, canHostLiveEvents: false, canHostLiveAuctions: false, canHostLiveBreaks: false, canCreateStorefront: false, canUseApi: true, featuredListingsIncluded: 3 },
  { name: 'Dealer', tier: 'DEALER', description: 'For shops, breakers, and professional sellers', monthlyPrice: 29.99, yearlyPrice: 299, inventoryLimit: 999999, listingLimit: 999999, storageLimitGb: 100, canImportInventory: true, canExportInventory: true, canUseAdvancedAnalytics: true, canHostLiveEvents: true, canHostLiveAuctions: true, canHostLiveBreaks: true, canCreateStorefront: true, canUseApi: true, featuredListingsIncluded: 10 },
];

export async function GET() {
  let plans = await (prisma as any).membershipPlan.findMany({ where: { active: true }, orderBy: { monthlyPrice: 'asc' } });
  if (plans.length === 0) {
    for (const p of SEED_PLANS) await (prisma as any).membershipPlan.create({ data: p }).catch(() => {});
    plans = await (prisma as any).membershipPlan.findMany({ where: { active: true }, orderBy: { monthlyPrice: 'asc' } });
  }
  return NextResponse.json({ plans });
}
