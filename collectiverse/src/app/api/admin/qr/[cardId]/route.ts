import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateQRDataUrl } from '@/lib/qr';

export async function GET(_req: NextRequest, { params }: { params: { cardId: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const qrDataUrl = await generateQRDataUrl(params.cardId);
  return NextResponse.json({ qrDataUrl, cardId: params.cardId });
}
