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

  // Determine variant: thumb or display (never original)
  const variant = req.nextUrl.searchParams.get('variant') || 'display';
  // Also support legacy ?size=thumb
  const size = req.nextUrl.searchParams.get('size');
  const useThumb = variant === 'thumb' || size === 'thumb';

  // Resolve filename
  // DB stores display filename like "front-display.webp"
  // Thumb is "front-thumb.webp"
  let filename: string;
  if (useThumb) {
    filename = storedValue.replace('-display.', '-thumb.');
  } else {
    filename = storedValue;
  }

  // Ensure we never serve originals
  if (filename.includes('-original')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const dir = join(process.cwd(), 'storage', 'private', 'users', userId, 'inventory', params.id);
  const filePath = join(dir, filename);

  // Verify path is within allowed directory
  const allowedBase = join(process.cwd(), 'storage', 'private', 'users', userId);
  if (!filePath.startsWith(allowedBase)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Check file exists, fall back to display if thumb missing
  try {
    await stat(filePath);
  } catch {
    if (useThumb) {
      // Fall back to display version
      const displayPath = join(dir, storedValue);
      try {
        await stat(displayPath);
        const buffer = await readFile(displayPath);
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'private, max-age=3600',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      } catch {
        return new NextResponse('File not found', { status: 404 });
      }
    }
    return new NextResponse('File not found', { status: 404 });
  }

  const buffer = await readFile(filePath);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  });
}
