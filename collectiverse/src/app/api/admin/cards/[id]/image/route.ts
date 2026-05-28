import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveCardImageDerivatives } from '@/lib/card-image-processing';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const card = await prisma.card.findUnique({ where: { id: params.id } });
  if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

  const formData = await req.formData();
  const updateData: Record<string, string> = {};

  for (const fieldName of ['frontImage', 'backImage'] as const) {
    const file = formData.get(fieldName);
    if (!file || !(file instanceof File) || file.size === 0) continue;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type for ${fieldName}` }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `${fieldName} exceeds 10 MB` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const type = fieldName === 'frontImage' ? 'front' : 'back';

    const { displayUrl, thumbUrl } = await saveCardImageDerivatives({
      cardId: params.id,
      type,
      buffer,
    });

    if (type === 'front') {
      updateData.frontImageUrl = displayUrl;
    } else {
      updateData.backImageUrl = displayUrl;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid files uploaded' }, { status: 400 });
  }

  await prisma.card.update({ where: { id: params.id }, data: updateData });

  return NextResponse.json({ success: true, ...updateData });
}
