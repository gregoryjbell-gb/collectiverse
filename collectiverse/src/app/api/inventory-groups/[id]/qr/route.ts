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

  const group = await (prisma as any).inventoryGroup.findFirst({
    where: { id: params.id, userId },
    include: { cardSet: { select: { name: true, year: true } } },
  });
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let publicId = group.publicId;
  if (!publicId) {
    publicId = randomUUID().replace(/-/g, '').slice(0, 12);
    await (prisma as any).inventoryGroup.update({ where: { id: params.id }, data: { publicId, passportEnabled: true } });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const passportUrl = `${baseUrl}/passport/group/${publicId}`;
  const qrDataUrl = await generateQRDataUrl(passportUrl);

  return NextResponse.json({
    qrDataUrl,
    passportUrl,
    publicId,
    label: {
      name: group.name,
      setName: group.cardSet?.name || '',
      year: group.cardSet?.year || '',
      groupType: group.groupType,
    },
  });
}
