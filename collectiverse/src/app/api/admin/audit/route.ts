import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const entityType = req.nextUrl.searchParams.get('entityType');
  const entityId = req.nextUrl.searchParams.get('entityId');

  const where: any = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;

  const logs = await (prisma as any).auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ logs });
}
