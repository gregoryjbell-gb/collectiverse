import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const address = await (prisma as any).shippingAddress.findFirst({ where: { id: params.id, userId } });
  if (!address) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

  const body = await req.json();
  const allowed = ['label', 'fullName', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country', 'phone', 'isDefault', 'addressType'];
  const data: any = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  // If setting as default, unset others
  if (data.isDefault) {
    await (prisma as any).shippingAddress.updateMany({
      where: { userId, isDefault: true, id: { not: params.id } },
      data: { isDefault: false },
    });
  }

  const updated = await (prisma as any).shippingAddress.update({ where: { id: params.id }, data });
  return NextResponse.json({ address: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const address = await (prisma as any).shippingAddress.findFirst({ where: { id: params.id, userId } });
  if (!address) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

  await (prisma as any).shippingAddress.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
