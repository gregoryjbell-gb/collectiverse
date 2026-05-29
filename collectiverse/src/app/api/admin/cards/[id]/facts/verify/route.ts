import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { factIds } = body;

  if (!factIds?.length) {
    return NextResponse.json({ error: 'factIds required' }, { status: 400 });
  }

  await (prisma as any).cardFact.updateMany({
    where: { id: { in: factIds }, cardId: params.id },
    data: { verificationStatus: 'ADMIN_VERIFIED', confidenceScore: 1.0 },
  });

  return NextResponse.json({ success: true, verified: factIds.length });
}
