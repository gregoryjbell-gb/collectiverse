import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

const TYPE_FIELD_MAP: Record<string, string> = {
  front: 'frontScanUrl',
  back: 'backScanUrl',
  private: 'privateImageUrl',
};

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export async function GET(_req: NextRequest, { params }: { params: { id: string; type: string } }) {
  const session = await getSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return new NextResponse('Unauthorized', { status: 401 }); }

  // Validate type parameter
  const dbField = TYPE_FIELD_MAP[params.type];
  if (!dbField) return new NextResponse('Invalid media type', { status: 400 });

  // Load item and verify ownership
  const item = await prisma.inventoryItem.findFirst({
    where: { id: params.id, userId },
    select: { frontScanUrl: true, backScanUrl: true, privateImageUrl: true, storagePath: true },
  });
  if (!item) return new NextResponse('Not found', { status: 404 });

  // Get the stored path reference
  const storedUrl = (item as any)[dbField] as string | null;
  if (!storedUrl) return new NextResponse('No image', { status: 404 });

  // Resolve to filesystem path
  // storedUrl formats:
  // Legacy: /uploads/users/{userId}/inventory/{itemId}/filename.ext (in public/)
  // New: /uploads/users/{userId}/inventory/{itemId}/filename.ext (in storage/private/)
  let filePath: string;

  // Try private storage first, fall back to public
  const privatePath = join(process.cwd(), 'storage', 'private', 'users', userId, 'inventory', params.id, storedUrl.split('/').pop() || '');
  const publicPath = join(process.cwd(), 'public', storedUrl);

  try {
    await stat(privatePath);
    filePath = privatePath;
  } catch {
    try {
      await stat(publicPath);
      filePath = publicPath;
    } catch {
      return new NextResponse('File not found', { status: 404 });
    }
  }

  // Prevent path traversal — must be within user's directories
  const allowedBase1 = join(process.cwd(), 'public', 'uploads', 'users', userId);
  const allowedBase2 = join(process.cwd(), 'storage', 'private', 'users', userId);
  if (!filePath.startsWith(allowedBase1) && !filePath.startsWith(allowedBase2)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Read and serve
  const buffer = await readFile(filePath);
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const contentType = MIME_MAP[ext] || 'application/octet-stream';

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
