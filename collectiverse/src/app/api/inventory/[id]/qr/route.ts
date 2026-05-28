import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateQRDataUrl } from '@/lib/qr';
import { randomUUID } from 'crypto';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const item = await (prisma as any).inventoryItem.findFirst({
    where: { id: params.id, userId },
    include: { card: { include: { person: { select: { displayName: true } }, set: { select: { name: true, year: true } } } } },
  });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Ensure publicId exists
  let publicId = item.publicId;
  if (!publicId) {
    publicId = randomUUID().replace(/-/g, '').slice(0, 12);
    await (prisma as any).inventoryItem.update({ where: { id: params.id }, data: { publicId, passportEnabled: true } });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const passportUrl = `${baseUrl}/passport/item/${publicId}`;
  const qrDataUrl = await generateQRDataUrl(passportUrl);

  return NextResponse.json({
    qrDataUrl,
    passportUrl,
    publicId,
    label: {
      name: item.card?.person?.displayName || 'Card',
      setName: item.card?.set?.name || '',
      year: item.card?.set?.year || item.card?.year,
      cardNumber: item.card?.cardNumber || '',
    },
  });
}
