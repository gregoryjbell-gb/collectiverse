import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const profile = await (prisma as any).inventoryImportProfile.findFirst({
    where: { id: params.id, OR: [{ systemProfile: true }, { userId }] },
  });
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const profile = await (prisma as any).inventoryImportProfile.findFirst({ where: { id: params.id, userId } });
  if (!profile) return NextResponse.json({ error: 'Profile not found or not yours' }, { status: 404 });
  if (profile.systemProfile) return NextResponse.json({ error: 'Cannot edit system profiles' }, { status: 403 });

  const body = await req.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.columnMappings !== undefined) data.columnMappings = JSON.stringify(body.columnMappings);
  if (body.sampleHeaders !== undefined) data.sampleHeaders = JSON.stringify(body.sampleHeaders);

  const updated = await (prisma as any).inventoryImportProfile.update({ where: { id: params.id }, data });
  return NextResponse.json({ profile: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const profile = await (prisma as any).inventoryImportProfile.findFirst({ where: { id: params.id, userId } });
  if (!profile) return NextResponse.json({ error: 'Profile not found or not yours' }, { status: 404 });
  if (profile.systemProfile) return NextResponse.json({ error: 'Cannot delete system profiles' }, { status: 403 });

  await (prisma as any).inventoryImportProfile.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
