import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [missingYear, missingSet, missingNumber, missingImage, userImported, needsReview, conflicted, noSource] = await Promise.all([
    (prisma as any).card.count({ where: { year: null } }),
    (prisma as any).card.count({ where: { setId: null } }),
    (prisma as any).card.count({ where: { cardNumber: null } }),
    (prisma as any).card.count({ where: { frontImageUrl: null } }),
    (prisma as any).card.count({ where: { publicDataStatus: 'USER_IMPORTED' } }),
    (prisma as any).card.count({ where: { publicDataStatus: 'NEEDS_REVIEW' } }),
    (prisma as any).cardFact.count({ where: { verificationStatus: 'CONFLICTED' } }).catch(() => 0),
    (prisma as any).card.count({ where: { collectibleId: null } }),
  ]);

  const failedImports = await (prisma as any).importBatch.count({ where: { status: 'FAILED' } }).catch(() => 0);
  const provisionalCards = userImported + needsReview;

  return NextResponse.json({
    summary: { missingRequiredFields: missingYear + missingSet + missingNumber, duplicateCandidates: 0, needsReview: provisionalCards, sourceConflicts: conflicted, missingImages: missingImage },
    cards: { missingYear, missingSet, missingNumber, missingImage, userImported, needsReview, noCollectible: noSource },
    verification: { conflicted },
    imports: { failed: failedImports, provisionalCards },
  });
}
