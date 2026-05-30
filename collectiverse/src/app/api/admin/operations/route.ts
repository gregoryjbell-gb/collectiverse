import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [reports, cardReviews, disputes, liveEvents, importBatches] = await Promise.all([
    (prisma as any).report.groupBy({ by: ['status'], _count: true }),
    (prisma as any).publicCardReview.count({ where: { status: 'PENDING' } }).catch(() => 0),
    (prisma as any).dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
    (prisma as any).liveEvent.count({ where: { status: 'LIVE' } }),
    (prisma as any).importBatch.count({ where: { status: { in: ['PROCESSING', 'FAILED'] } } }),
  ]);

  const reportCounts: Record<string, number> = {};
  for (const r of (reports as any[])) reportCounts[r.status] = r._count;
  const pendingReports = (reportCounts['SUBMITTED'] || 0) + (reportCounts['UNDER_REVIEW'] || 0);

  const copyrightReports = await (prisma as any).report.count({ where: { type: 'COPYRIGHT', status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } });
  const verificationConflicts = await (prisma as any).cardFact.count({ where: { verificationStatus: 'CONFLICTED' } }).catch(() => 0);
  const provisionalCards = await (prisma as any).card.count({ where: { publicDataStatus: { in: ['USER_IMPORTED', 'NEEDS_REVIEW'] } } }).catch(() => 0);

  return NextResponse.json({
    reportCounts: { pending: pendingReports, copyright: copyrightReports, total: Object.values(reportCounts).reduce((a: number, b: number) => a + b, 0) },
    reviewCounts: { cardReviews, provisionalCards, verificationConflicts },
    importCounts: { processing: importBatches },
    disputeCounts: { active: disputes },
    liveCounts: { active: liveEvents },
  });
}
