import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const job = await (prisma as any).importJob.findUnique({
    where: { id: params.id },
    include: { connector: { select: { name: true, connectorType: true, configJson: true } } },
  });
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ job, preview: job.previewData ? JSON.parse(job.previewData) : [] });
}
