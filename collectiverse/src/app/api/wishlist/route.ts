import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const status = req.nextUrl.searchParams.get('status') || 'ACTIVE';

  const items = await (prisma as any).wishlistItem.findMany({
    where: { userId, ...(status !== 'all' ? { status } : {}) },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });

  // Enrich with card/set data
  const enriched = await Promise.all(items.map(async (item: any) => {
    let card = null;
    let cardSet = null;
    if (item.cardId) card = await prisma.card.findUnique({ where: { id: item.cardId }, include: { person: { select: { displayName: true } }, set: { select: { name: true, year: true } }, team: { select: { name: true } } } });
    if (item.cardSetId) cardSet = await prisma.cardSet.findUnique({ where: { id: item.cardSetId }, select: { name: true, year: true, manufacturer: true } });
    return { ...item, card, cardSet };
  }));

  return NextResponse.json({ items: enriched });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const data = await req.json();
  const { cardId, cardSetId, collectibleCategory, priority, targetPrice, desiredGradeCompany, desiredGradeValue, notes } = data;

  if (!cardId && !cardSetId && !collectibleCategory) {
    return NextResponse.json({ error: 'Provide cardId, cardSetId, or collectibleCategory' }, { status: 400 });
  }

  const item = await (prisma as any).wishlistItem.create({
    data: {
      userId,
      cardId: cardId || null,
      cardSetId: cardSetId || null,
      collectibleCategory: collectibleCategory || null,
      priority: priority || 'MEDIUM',
      targetPrice: targetPrice ? parseFloat(targetPrice) : null,
      desiredGradeCompany: desiredGradeCompany || null,
      desiredGradeValue: desiredGradeValue || null,
      notes: notes || null,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
