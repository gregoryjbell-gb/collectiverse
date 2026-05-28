import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { status, resolution } = await req.json();
  const updateData: any = {};
  if (status) updateData.status = status;
  if (resolution) updateData.resolution = resolution;
  if (status === 'RESOLVED' || status === 'DISMISSED') {
    updateData.resolvedById = session.sub;
    updateData.resolvedAt = new Date();
  }

  const report = await (prisma as any).report.update({ where: { id: params.id }, data: updateData });

  // Audit log
  await (prisma as any).auditLog.create({
    data: { action: 'RESOLVE', entityType: 'REPORT', entityId: params.id, adminId: session.sub, notes: resolution },
  });

  return NextResponse.json({ report });
}
