import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { runImportJob } from '@/lib/import-worker';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const importJob = await (prisma as any).importJob.findUnique({ where: { id: params.id } });
  if (!importJob) return NextResponse.json({ error: 'Import job not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const jobType = body.jobType || 'IMPORT';

  // Create queue job
  const queueJob = await (prisma as any).importQueueJob.create({
    data: {
      importJobId: params.id,
      jobType,
      status: 'QUEUED',
      totalRows: importJob.totalRecords || 0,
    },
  });

  // Run async (fire and forget — in production use a real queue)
  runImportJob(queueJob.id).catch((err) => {
    console.error('Import job failed:', err);
  });

  return NextResponse.json({ queueJob }, { status: 201 });
}
