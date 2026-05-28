import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// List card images, optionally filtered by permission status
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const status = req.nextUrl.searchParams.get('status');
  const where: any = {};
  if (status) where.permissionStatus = status;

  const images = await prisma.cardImage.findMany({
    where,
    include: { card: { include: { person: { select: { displayName: true } }, set: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ images });
}
