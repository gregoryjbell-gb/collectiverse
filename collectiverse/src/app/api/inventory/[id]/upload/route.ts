import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

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

  // Get userId from session only — never trust client
  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  // Verify ownership: item must belong to authenticated user
  const item = await prisma.inventoryItem.findFirst({ where: { id: params.id, userId } });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const formData = await req.formData();
  const updateData: Record<string, string> = {};
  const urls: Record<string, string> = {};

  // Storage path: /public/uploads/users/{userId}/inventory/{inventoryItemId}/
  const dir = join(process.cwd(), 'public', 'uploads', 'users', userId, 'inventory', params.id);
  await mkdir(dir, { recursive: true });

  for (const [fieldName, dbField] of Object.entries(FIELD_MAP)) {
    const file = formData.get(fieldName);
    if (!file || !(file instanceof File) || file.size === 0) continue;

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type for ${fieldName}. Allowed: JPEG, PNG, WebP` }, { status: 400 });
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `${fieldName} exceeds 10 MB limit` }, { status: 400 });
    }

    // Generate safe unique filename — never use original filename
    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    const filename = `${fieldName}-${randomUUID()}.${ext}`;

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(dir, filename), buffer);

    // URL path (relative to public/)
    const url = `/uploads/users/${userId}/inventory/${params.id}/${filename}`;
    updateData[dbField] = url;
    urls[fieldName] = url;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid files uploaded' }, { status: 400 });
  }

  // Update inventory item with new URLs
  await prisma.inventoryItem.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({ urls, message: 'Upload successful' });
}
