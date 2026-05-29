import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const liveBreak = await (prisma as any).liveBreak.findUnique({ where: { id: params.id } });
  if (!liveBreak || liveBreak.sellerUserId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { description, liveBreakSpotId, inventoryItemId, cardId, assignedToUserId } = body;

  if (!description) return NextResponse.json({ error: 'description is required' }, { status: 400 });

  const hit = await (prisma as any).liveBreakHit.create({
    data: {
      liveBreakId: params.id,
      liveBreakSpotId: liveBreakSpotId || null,
      inventoryItemId: inventoryItemId || null,
      cardId: cardId || null,
      description,
      assignedToUserId: assignedToUserId || null,
    },
  });

  // Chat message
  await (prisma as any).liveEventMessage.create({
    data: { liveEventId: liveBreak.liveEventId, messageType: 'SYSTEM', message: `🔥 HIT: ${description}` },
  });

  return NextResponse.json({ hit }, { status: 201 });
}
