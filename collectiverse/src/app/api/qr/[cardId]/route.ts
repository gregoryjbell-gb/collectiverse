import { NextRequest, NextResponse } from 'next/server';
import { generateQRDataUrl } from '@/lib/qr';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { cardId: string } }) {
  const card = await prisma.card.findUnique({ where: { id: params.cardId }, select: { id: true } });
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const qrDataUrl = await generateQRDataUrl(params.cardId);
  return NextResponse.json({ qrDataUrl, cardId: params.cardId });
}
