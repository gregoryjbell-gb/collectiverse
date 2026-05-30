import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  const body = await req.json();
  const { type, targetType, targetId, title, reason, url, evidenceUrl, reporterName, reporterEmail } = body;

  if (!type || !reason) return NextResponse.json({ error: 'type and reason required' }, { status: 400 });

  let userId = null;
  if (session) { const { ensureUserId } = await import('@/lib/auth'); userId = await ensureUserId(session); }

  if (!userId && !reporterEmail) return NextResponse.json({ error: 'Email required for anonymous reports' }, { status: 400 });

  const report = await (prisma as any).report.create({
    data: { type, targetType: targetType || 'OTHER', targetId: targetId || '', reportedById: userId, reporterName: reporterName || null, reporterEmail: reporterEmail || null, title: title || null, reason, url: url || null, evidenceUrl: evidenceUrl || null },
  });

  return NextResponse.json({ report, message: 'Report submitted. Thank you.' }, { status: 201 });
}
