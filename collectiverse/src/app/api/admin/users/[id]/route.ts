import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const updateData: any = {};
  if (data.email !== undefined) updateData.email = data.email;
  if (data.username !== undefined) updateData.username = data.username || null;
  if (data.displayName !== undefined) updateData.displayName = data.displayName || null;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.password) updateData.passwordHash = hashPassword(data.password);

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, email: true, username: true, displayName: true, role: true, createdAt: true },
  });
  return NextResponse.json({ user });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Prevent self-deletion
  if (params.id === session.sub) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
