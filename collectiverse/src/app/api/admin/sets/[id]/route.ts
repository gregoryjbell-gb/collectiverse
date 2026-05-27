import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.year !== undefined) updateData.year = parseInt(data.year);
  if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer || null;
  if (data.sportId !== undefined) updateData.sportId = data.sportId || null;
  if (data.releaseDate !== undefined) updateData.releaseDate = data.releaseDate || null;

  const set = await prisma.cardSet.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json({ set });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.cardSet.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
