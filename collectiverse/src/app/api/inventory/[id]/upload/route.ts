import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { applyWatermark, generateThumbnail, PRIVATE_WATERMARK, IMAGE_SIZES } from '@/lib/image-watermark';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const FIELD_MAP: Record<string, string> = {
  frontScan: 'frontScanUrl',
  backScan: 'backScanUrl',
  privateImage: 'privateImageUrl',
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
  const watermarkName = user?.displayName || user?.username || 'User';

  const formData = await req.formData();
  const updateData: Record<string, string> = {};
  const urls: Record<string, string> = {};

  const privateDir = join(process.cwd(), 'storage', 'private', 'users', userId, 'inventory', params.id);
  await mkdir(privateDir, { recursive: true });

  for (const [fieldName, dbField] of Object.entries(FIELD_MAP)) {
    const file = formData.get(fieldName);
    if (!file || !(file instanceof File) || file.size === 0) continue;

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type for ${fieldName}. Allowed: JPEG, PNG, WebP` }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `${fieldName} exceeds 10 MB limit` }, { status: 400 });
    }

    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const uuid = randomUUID();
    const originalFilename = `original-${fieldName}-${uuid}.${ext}`;
    const displayFilename = `display-${fieldName}-${uuid}.webp`;
    const thumbFilename = `thumb-${fieldName}-${uuid}.webp`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Store original (never served directly)
    await writeFile(join(privateDir, originalFilename), buffer);

    // Generate watermarked display version
    const watermarkConfig = PRIVATE_WATERMARK(watermarkName);
    const displayBuffer = await applyWatermark(buffer, watermarkConfig, IMAGE_SIZES.display.width);
    await writeFile(join(privateDir, displayFilename), displayBuffer);

    // Generate thumbnail
    const thumbBuffer = await generateThumbnail(buffer, IMAGE_SIZES.thumbnail.width, IMAGE_SIZES.thumbnail.height);
    await writeFile(join(privateDir, thumbFilename), thumbBuffer);

    // Store display filename in DB (media route will serve this)
    updateData[dbField] = displayFilename;

    const mediaType = fieldName === 'frontScan' ? 'front' : fieldName === 'backScan' ? 'back' : 'private';
    urls[fieldName] = `/api/inventory/${params.id}/media/${mediaType}`;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid files uploaded' }, { status: 400 });
  }

  await prisma.inventoryItem.update({ where: { id: params.id }, data: updateData });

  return NextResponse.json({ urls, message: 'Upload successful' });
}
