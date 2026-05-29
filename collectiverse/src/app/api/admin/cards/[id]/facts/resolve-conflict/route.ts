import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { fieldName, correctFactId, rejectFactIds } = body;

  if (!fieldName || !correctFactId) {
    return NextResponse.json({ error: 'fieldName and correctFactId required' }, { status: 400 });
  }

  // Mark the correct fact as ADMIN_VERIFIED
  await (prisma as any).cardFact.update({
    where: { id: correctFactId },
    data: { verificationStatus: 'ADMIN_VERIFIED', confidenceScore: 1.0 },
  });

  // Mark rejected facts
  if (rejectFactIds?.length > 0) {
    await (prisma as any).cardFact.updateMany({
      where: { id: { in: rejectFactIds } },
      data: { verificationStatus: 'UNVERIFIED', confidenceScore: 0.1 },
    });
  }

  // Update the card field with the verified value
  const correctFact = await (prisma as any).cardFact.findUnique({ where: { id: correctFactId } });
  if (correctFact) {
    const updateData: any = {};
    const fieldMap: Record<string, string> = {
      subjectName: 'personId', // handled separately
      team: 'teamId', // handled separately
      cardNumber: 'cardNumber',
      year: 'year',
      parallel: 'parallel',
      rookie: 'rookie',
      autograph: 'autograph',
      relic: 'relic',
      serialNumber: 'serialNumber',
      printRun: 'printRun',
    };

    const dbField = fieldMap[fieldName];
    if (dbField && !['personId', 'teamId'].includes(dbField)) {
      if (['year', 'printRun'].includes(dbField)) {
        updateData[dbField] = parseInt(correctFact.fieldValue) || null;
      } else if (['rookie', 'autograph', 'relic'].includes(dbField)) {
        updateData[dbField] = correctFact.fieldValue === 'true';
      } else {
        updateData[dbField] = correctFact.fieldValue;
      }
      await (prisma as any).card.update({ where: { id: params.id }, data: updateData });
    }
  }

  return NextResponse.json({ success: true, resolved: fieldName });
}
