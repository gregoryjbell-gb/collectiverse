import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const listing = await (prisma as any).listing.findFirst({ where: { id: params.id, userId } });
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ listing });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const existing = await (prisma as any).listing.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const updateData: any = {};
  const allowedFields = ['status', 'price', 'minimumOffer', 'allowOffers', 'allowTrades', 'description', 'shippingNotes'];
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (['price', 'minimumOffer'].includes(field)) updateData[field] = data[field] ? parseFloat(data[field]) : null;
      else if (['allowOffers', 'allowTrades'].includes(field)) updateData[field] = Boolean(data[field]);
      else updateData[field] = data[field] || null;
    }
  }

  // If marking as SOLD, set soldAt and optionally update inventory
  if (data.status === 'SOLD') {
    updateData.soldAt = new Date();
    if (data.markInventorySold !== false) {
      if (existing.inventoryItemId) {
        await prisma.inventoryItem.update({ where: { id: existing.inventoryItemId }, data: { status: 'SOLD' } });
      }
      if (existing.inventoryGroupId) {
        await (prisma as any).inventoryGroup.update({ where: { id: existing.inventoryGroupId }, data: { status: 'SOLD' } });
      }
    }
  }

  const listing = await (prisma as any).listing.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json({ listing });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const existing = await (prisma as any).listing.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await (prisma as any).listing.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
