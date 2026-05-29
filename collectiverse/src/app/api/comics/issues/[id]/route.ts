import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const issue = await (prisma as any).comicIssue.findUnique({
    where: { id: params.id },
    include: { comicSeries: true },
  });
  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  return NextResponse.json({ issue });
}
