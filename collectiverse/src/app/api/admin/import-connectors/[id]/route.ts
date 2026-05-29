import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const connector = await (prisma as any).importConnector.findUnique({
    where: { id: params.id },
    include: { jobs: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
  if (!connector) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ connector });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const allowed = ['name', 'connectorType', 'status', 'defaultDataSourceId', 'configJson'];
  const data: any = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      data[key] = key === 'configJson' && typeof body[key] === 'object' ? JSON.stringify(body[key]) : body[key];
    }
  }

  const connector = await (prisma as any).importConnector.update({ where: { id: params.id }, data });
  return NextResponse.json({ connector });
}
