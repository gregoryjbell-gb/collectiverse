import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const existing = await (prisma as any).wishlistItem.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await req.json();
  const updateData: any = {};
  const fields = ['priority', 'targetPrice', 'desiredGradeCompany', 'desiredGradeValue', 'notes', 'status', 'collectibleCategory'];
  for (const f of fields) {
    if (data[f] !== undefined) {
      if (f === 'targetPrice') updateData[f] = data[f] ? parseFloat(data[f]) : null;
      else updateData[f] = data[f] || null;
    }
  }

  const item = await (prisma as any).wishlistItem.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json({ item });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const existing = await (prisma as any).wishlistItem.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await (prisma as any).wishlistItem.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
