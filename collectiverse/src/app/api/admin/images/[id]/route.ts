import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Update image metadata / review status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const updateData: any = {};

  const allowedFields = ['permissionStatus', 'sourceType', 'sourceUrl', 'sourceName', 'licenseType', 'attributionText', 'copyrightNotes'];
  for (const field of allowedFields) {
    if (data[field] !== undefined) updateData[field] = data[field] || null;
  }

  // If reviewing, set reviewer info
  if (data.permissionStatus && ['ALLOWED', 'LICENSED', 'REJECTED'].includes(data.permissionStatus)) {
    updateData.reviewedByAdminId = session.sub;
    updateData.reviewedAt = new Date();
  }

  const image = await prisma.cardImage.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json({ image });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.cardImage.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
