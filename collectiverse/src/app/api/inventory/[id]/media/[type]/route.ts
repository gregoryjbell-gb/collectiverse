import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile, stat } from 'fs/promises';
import { join, basename } from 'path';
import { getImageSecurityHeaders } from '@/lib/image-watermark';

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

export async function GET(req: NextRequest, { params }: { params: { id: string; type: string } }) {
  const session = await getSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return new NextResponse('Unauthorized', { status: 401 }); }

  const dbField = TYPE_FIELD_MAP[params.type];
  if (!dbField) return new NextResponse('Invalid media type', { status: 400 });

  // Load item and verify ownership
  const item = await prisma.inventoryItem.findFirst({
    where: { id: params.id, userId },
    select: { frontScanUrl: true, backScanUrl: true, privateImageUrl: true },
  });
  if (!item) return new NextResponse('Not found', { status: 404 });

  const storedValue = (item as Record<string, unknown>)[dbField] as string | null;
  if (!storedValue) return new NextResponse('No image', { status: 404 });

  // Determine which variant to serve
  const size = req.nextUrl.searchParams.get('size'); // 'thumb' or default (display)
  let filename = basename(storedValue);

  // If requesting thumbnail, try to find thumb variant
  if (size === 'thumb') {
    const thumbFilename = filename.replace('display-', 'thumb-');
    const thumbPath = join(process.cwd(), 'storage', 'private', 'users', userId, 'inventory', params.id, thumbFilename);
    try {
      await stat(thumbPath);
      filename = thumbFilename;
    } catch {
      // Fall back to display version
    }
  }

  const filePath = join(process.cwd(), 'storage', 'private', 'users', userId, 'inventory', params.id, filename);

  // Verify path is within allowed directory (prevent traversal)
  const allowedBase = join(process.cwd(), 'storage', 'private', 'users', userId);
  if (!filePath.startsWith(allowedBase)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Check file exists
  try {
    await stat(filePath);
  } catch {
    return new NextResponse('File not found', { status: 404 });
  }

  const buffer = await readFile(filePath);
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const contentType = MIME_MAP[ext] || 'application/octet-stream';

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      ...getImageSecurityHeaders(),
    },
  });
}
