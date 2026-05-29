import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const importJob = await (prisma as any).importJob.findUnique({ where: { id: params.id } });
  if (!importJob) return NextResponse.json({ error: 'Import job not found' }, { status: 404 });

  // Get latest queue job for this import
  const queueJobs = await (prisma as any).importQueueJob.findMany({
    where: { importJobId: params.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const latestJob = queueJobs[0] || null;

  return NextResponse.json({
    importJob,
    queueJobs,
    latestJob,
    progress: latestJob ? {
      status: latestJob.status,
      percent: latestJob.progressPercent,
      processedRows: latestJob.processedRows,
      totalRows: latestJob.totalRows,
      error: latestJob.errorMessage,
    } : null,
  });
}
