import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getReservationStatus } from '@/lib/inventory-reservation';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const inventoryItemId = searchParams.get('inventoryItemId');
  const inventoryGroupId = searchParams.get('inventoryGroupId');

  if (!inventoryItemId && !inventoryGroupId) {
    return NextResponse.json({ error: 'inventoryItemId or inventoryGroupId required' }, { status: 400 });
  }

  const status = await getReservationStatus({ inventoryItemId, inventoryGroupId });
  return NextResponse.json(status);
}
