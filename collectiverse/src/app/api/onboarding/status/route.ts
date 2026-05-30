import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

const STEPS = [
  { key: 'CREATE_PROFILE', label: 'Complete your profile', href: '/account', icon: '👤' },
  { key: 'ADD_FIRST_COLLECTIBLE', label: 'Add your first collectible', href: '/inventory/add/select-type', icon: '📦' },
  { key: 'IMPORT_INVENTORY', label: 'Import from another app', href: '/inventory/import', icon: '📥' },
  { key: 'CREATE_WISHLIST_ITEM', label: 'Add a wishlist item', href: '/wishlist', icon: '⭐' },
  { key: 'ENABLE_QR_PASSPORT', label: 'Generate a QR label', href: '/qr-labels', icon: '📱' },
  { key: 'CREATE_LISTING', label: 'List something for sale', href: '/listings/add', icon: '🏷️' },
  { key: 'VIEW_MARKETPLACE', label: 'Browse the marketplace', href: '/marketplace', icon: '🛒' },
  { key: 'VIEW_ANALYTICS', label: 'Check your analytics', href: '/analytics', icon: '📊' },
  { key: 'JOIN_LIVE_EVENT', label: 'Join a live event', href: '/live', icon: '🔴' },
];

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const records = await (prisma as any).userOnboarding.findMany({ where: { userId } });
  const dismissed = records.some((r: any) => r.dismissed);

  const steps = STEPS.map(step => {
    const record = records.find((r: any) => r.stepKey === step.key);
    return { ...step, completed: record?.completed || false, completedAt: record?.completedAt || null };
  });

  const completedCount = steps.filter(s => s.completed).length;
  const percent = Math.round((completedCount / steps.length) * 100);

  return NextResponse.json({ steps, completedCount, totalSteps: steps.length, percent, dismissed });
}
