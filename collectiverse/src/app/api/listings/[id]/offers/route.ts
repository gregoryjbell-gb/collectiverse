import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const listing = await (prisma as any).listing.findUnique({ where: { id: params.id } });
  if (!listing || listing.status !== 'ACTIVE') return NextResponse.json({ error: 'Listing not found or not active' }, { status: 404 });
  if (listing.userId === userId) return NextResponse.json({ error: 'Cannot make offer on your own listing' }, { status: 400 });
  if (!listing.allowOffers) return NextResponse.json({ error: 'This listing does not accept offers' }, { status: 400 });

  const { amount, message } = await req.json();
  if (!amount || parseFloat(amount) <= 0) return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });

  if (listing.minimumOffer && parseFloat(amount) < listing.minimumOffer) {
    return NextResponse.json({ error: `Minimum offer is $${listing.minimumOffer}` }, { status: 400 });
  }

  const offer = await (prisma as any).offer.create({
    data: {
      listingId: params.id,
      buyerUserId: userId,
      sellerUserId: listing.userId,
      amount: parseFloat(amount),
      message: message || null,
    },
  });

  await createNotification({
    userId: listing.userId,
    type: 'TRANSFER_RECEIVED',
    title: 'New Offer Received',
    message: `You received a $${amount} offer on your listing.`,
    entityType: 'LISTING',
    entityId: params.id,
  });

  return NextResponse.json({ offer }, { status: 201 });
}
