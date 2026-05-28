import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const status = req.nextUrl.searchParams.get('status') || 'OPEN';
  const reports = await prisma.report.findMany({
    where: status === 'all' ? {} : { status },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({ reports });
}

// Create a report (any authenticated user)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, targetType, targetId, reason } = await req.json();
  if (!type || !targetType || !targetId || !reason) {
    return NextResponse.json({ error: 'type, targetType, targetId, and reason are required' }, { status: 400 });
  }

  const validTypes = ['INCORRECT_INFO', 'COPYRIGHT', 'OFFENSIVE', 'FAKE_SCAM', 'DUPLICATE'];
  if (!validTypes.includes(type)) return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });

  const report = await prisma.report.create({
    data: { type, targetType, targetId, reason, reportedById: session.sub },
  });

  return NextResponse.json({ report }, { status: 201 });
}
