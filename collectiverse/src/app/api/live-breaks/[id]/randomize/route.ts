import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit-log';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const liveBreak = await (prisma as any).liveBreak.findUnique({ where: { id: params.id }, include: { spots: { where: { status: 'SOLD' } } } });
  if (!liveBreak || liveBreak.sellerUserId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (liveBreak.randomizationCompletedAt) return NextResponse.json({ error: 'Already randomized' }, { status: 400 });

  const spots = liveBreak.spots;
  if (spots.length === 0) return NextResponse.json({ error: 'No sold spots to randomize' }, { status: 400 });

  // Shuffle assignments based on break type
  const assignments: string[] = [];
  if (liveBreak.breakType === 'RANDOM_TEAM') {
    // Generate team labels (placeholder — in production, pull from sport/league)
    for (let i = 0; i < spots.length; i++) assignments.push(`Team ${i + 1}`);
  } else if (liveBreak.breakType === 'RANDOM_DIVISION') {
    const divisions = ['NFC East', 'NFC West', 'NFC North', 'NFC South', 'AFC East', 'AFC West', 'AFC North', 'AFC South'];
    for (let i = 0; i < spots.length; i++) assignments.push(divisions[i % divisions.length]);
  } else {
    for (let i = 0; i < spots.length; i++) assignments.push(`Pack ${i + 1}`);
  }

  // Fisher-Yates shuffle
  for (let i = assignments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [assignments[i], assignments[j]] = [assignments[j], assignments[i]];
  }

  // Apply assignments
  for (let i = 0; i < spots.length; i++) {
    const data: any = { status: 'ASSIGNED' };
    if (liveBreak.breakType === 'RANDOM_TEAM' || liveBreak.breakType === 'PICK_YOUR_TEAM') {
      data.assignedTeam = assignments[i];
    } else if (liveBreak.breakType === 'RANDOM_DIVISION') {
      data.assignedDivision = assignments[i];
    } else {
      data.assignedPackNumber = i + 1;
    }
    await (prisma as any).liveBreakSpot.update({ where: { id: spots[i].id }, data });
  }

  await (prisma as any).liveBreak.update({ where: { id: params.id }, data: { status: 'RANDOMIZED', randomizationCompletedAt: new Date() } });

  // Audit log
  await createAuditLog({
    actorUserId: userId,
    entityType: 'INVENTORY_GROUP',
    entityId: params.id,
    action: 'UPDATED',
    after: { assignments: spots.map((s: any, i: number) => ({ spotId: s.id, assignment: assignments[i] })) },
    notes: `Break randomization completed for "${liveBreak.title}"`,
  });

  // Chat message
  await (prisma as any).liveEventMessage.create({
    data: { liveEventId: liveBreak.liveEventId, messageType: 'SYSTEM', message: `🎲 Randomization complete for "${liveBreak.title}"!` },
  });

  return NextResponse.json({ success: true, assignments: spots.map((s: any, i: number) => ({ spotNumber: s.spotNumber, assignment: assignments[i] })) });
}
