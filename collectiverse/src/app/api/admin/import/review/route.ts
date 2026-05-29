import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const batches = await (prisma as any).importBatch.findMany({
    where: { status: { in: ['COMPLETED', 'PROCESSING'] } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ batches });
}
