import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveInventoryImageDerivatives } from '@/lib/image-processing';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const FIELD_MAP: Record<string, string> = {
  frontScan: 'frontScanUrl',
  backScan: 'backScanUrl',
  privateImage: 'privateImageUrl',
};
const FIELD_TYPE_MAP: Record<string, 'front' | 'back' | 'private'> = {
  frontScan: 'front',
  backScan: 'back',
  privateImage: 'private',
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const item = await prisma.inventoryItem.findFirst({ where: { id: params.id, userId } });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Get username for watermark
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true, username: true } });
  const watermarkText = `${user?.displayName || user?.username || 'User'} • Collectiverse`;

  const formData = await req.formData();
  const updateData: Record<string, string> = {};
  const urls: Record<string, string> = {};

  for (const [fieldName, dbField] of Object.entries(FIELD_MAP)) {
    const file = formData.get(fieldName);
    if (!file || !(file instanceof File) || file.size === 0) continue;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type for ${fieldName}. Allowed: JPEG, PNG, WebP` }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `${fieldName} exceeds 10 MB limit` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imageType = FIELD_TYPE_MAP[fieldName];

    // Process: normalize, watermark, save original/display/thumb
    const displayFilename = await saveInventoryImageDerivatives({
      userId,
      inventoryItemId: params.id,
      type: imageType,
      buffer,
      watermarkText,
    });

    // Store display filename in DB
    updateData[dbField] = displayFilename;

    // Return authenticated media URL
    urls[fieldName] = `/api/inventory/${params.id}/media/${imageType}`;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid files uploaded' }, { status: 400 });
  }

  await prisma.inventoryItem.update({ where: { id: params.id }, data: updateData });

  return NextResponse.json({ urls, message: 'Upload successful' });
}
