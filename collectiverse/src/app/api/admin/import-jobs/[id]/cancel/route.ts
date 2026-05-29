import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const job = await (prisma as any).importJob.findUnique({ where: { id: params.id } });
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (['IMPORTED', 'CANCELLED'].includes(job.status)) {
    return NextResponse.json({ error: 'Job cannot be cancelled' }, { status: 400 });
  }

  await (prisma as any).importJob.update({ where: { id: params.id }, data: { status: 'CANCELLED' } });
  return NextResponse.json({ success: true });
}
