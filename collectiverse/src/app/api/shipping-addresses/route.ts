import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const addresses = await (prisma as any).shippingAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json({ addresses });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const { label, fullName, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault, addressType } = body;

  if (!fullName || !addressLine1 || !city || !state || !postalCode) {
    return NextResponse.json({ error: 'fullName, addressLine1, city, state, and postalCode are required' }, { status: 400 });
  }

  // If setting as default, unset other defaults of same type
  if (isDefault) {
    await (prisma as any).shippingAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await (prisma as any).shippingAddress.create({
    data: {
      userId,
      label: label || null,
      fullName,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      state,
      postalCode,
      country: country || 'US',
      phone: phone || null,
      isDefault: isDefault || false,
      addressType: addressType || 'BOTH',
    },
  });

  return NextResponse.json({ address }, { status: 201 });
}
