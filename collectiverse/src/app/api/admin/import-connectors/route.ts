import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const connectors = await (prisma as any).importConnector.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { jobs: true } } },
  });

  return NextResponse.json({ connectors });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const { name, connectorType, defaultDataSourceId, configJson } = body;

  if (!name || !connectorType) {
    return NextResponse.json({ error: 'name and connectorType are required' }, { status: 400 });
  }

  const connector = await (prisma as any).importConnector.create({
    data: {
      name,
      connectorType,
      status: 'ACTIVE',
      defaultDataSourceId: defaultDataSourceId || null,
      configJson: configJson ? JSON.stringify(configJson) : null,
      createdByAdminId: userId,
    },
  });

  return NextResponse.json({ connector }, { status: 201 });
}
