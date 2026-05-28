import { NextRequest, NextResponse } from 'next/server';
import { getSession, ensureUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let userId: string;
  try { userId = await ensureUserId(session); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const where: any = { id: params.id };
  if (session.role !== 'ADMIN') where.OR = [{ openedByUserId: userId }, { againstUserId: userId }];

  const dispute = await (prisma as any).dispute.findFirst({ where, include: { messages: { orderBy: { createdAt: 'asc' } } } });
  if (!dispute) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ dispute });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only admins can update status/resolution
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Only admins can update disputes' }, { status: 403 });

  const { status, resolution, adminNotes } = await req.json();
  const updateData: any = {};
  if (status) updateData.status = status;
  if (resolution) updateData.resolution = resolution;
  if (adminNotes) updateData.adminNotes = adminNotes;
  if (status === 'RESOLVED' || status === 'CLOSED') updateData.resolvedAt = new Date();

  const dispute = await (prisma as any).dispute.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json({ dispute });
}
