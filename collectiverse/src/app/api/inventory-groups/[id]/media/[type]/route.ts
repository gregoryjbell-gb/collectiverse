import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

const TYPE_FIELD_MAP: Record<string, string> = {
  front: 'frontImageUrl',
  back: 'backImageUrl',
  private: 'privateImageUrl',
};

export async function GET(req: NextRequest, { params }: { params: { id: string; type: string } }) {
  const session = await getSession();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return new NextResponse('Unauthorized', { status: 401 }); }

  const dbField = TYPE_FIELD_MAP[params.type];
  if (!dbField) return new NextResponse('Invalid media type', { status: 400 });

  const group = await (prisma as any).inventoryGroup.findFirst({
    where: { id: params.id, userId },
    select: { frontImageUrl: true, backImageUrl: true, privateImageUrl: true },
  });
  if (!group) return new NextResponse('Not found', { status: 404 });

  const storedValue = group[dbField] as string | null;
  if (!storedValue) return new NextResponse('No image', { status: 404 });

  // Determine variant
  const variant = req.nextUrl.searchParams.get('variant') || 'display';
  let filename = storedValue;
  if (variant === 'thumb') {
    filename = storedValue.replace('-display.', '-thumb.');
  }

  // Never serve originals
  if (filename.includes('-original')) return new NextResponse('Forbidden', { status: 403 });

  const dir = join(process.cwd(), 'storage', 'private', 'users', userId, 'groups', params.id);
  const filePath = join(dir, filename);

  // Path traversal check
  const allowedBase = join(process.cwd(), 'storage', 'private', 'users', userId);
  if (!filePath.startsWith(allowedBase)) return new NextResponse('Forbidden', { status: 403 });

  try {
    await stat(filePath);
  } catch {
    // Fall back to display if thumb missing
    if (variant === 'thumb') {
      const displayPath = join(dir, storedValue);
      try { await stat(displayPath); const buf = await readFile(displayPath); return new NextResponse(buf, { status: 200, headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, max-age=3600' } }); } catch { /* fall through */ }
    }
    return new NextResponse('File not found', { status: 404 });
  }

  const buffer = await readFile(filePath);
  return new NextResponse(buffer, {
    status: 200,
    headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' },
  });
}
