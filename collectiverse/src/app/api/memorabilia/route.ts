import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const itemType = searchParams.get('itemType');

  const where: any = {};
  if (q) where.OR = [{ subjectName: { contains: q, mode: 'insensitive' } }, { team: { contains: q, mode: 'insensitive' } }, { eventName: { contains: q, mode: 'insensitive' } }];
  if (itemType) where.itemType = itemType;

  const items = await (prisma as any).memorabiliaItem.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { itemType, subjectName, team, sport, franchise, eventName, eventDate, manufacturer, brand, authenticationCompany, authenticationCertNumber, signed, inscription, gameUsed, limitedEdition, editionNumber, totalEditionSize, dimensions, material, provenanceNotes } = body;
  if (!itemType) return NextResponse.json({ error: 'itemType required' }, { status: 400 });

  const title = [subjectName, signed ? 'Signed' : null, itemType.replace(/_/g, ' ')].filter(Boolean).join(' ');
  const subtitle = [authenticationCompany, gameUsed ? 'Game Used' : null, limitedEdition ? `#${editionNumber || '?'}/${totalEditionSize || '?'}` : null].filter(Boolean).join(' • ') || null;

  const collectible = await (prisma as any).collectible.create({
    data: { collectibleType: 'MEMORABILIA', title, subtitle, manufacturer: manufacturer || brand || null, franchise: franchise || team || null, status: 'ACTIVE' },
  });

  const item = await (prisma as any).memorabiliaItem.create({
    data: {
      collectibleId: collectible.id, itemType, subjectName: subjectName || null, team: team || null, sport: sport || null, franchise: franchise || null,
      eventName: eventName || null, eventDate: eventDate ? new Date(eventDate) : null, manufacturer: manufacturer || null, brand: brand || null,
      authenticationCompany: authenticationCompany || null, authenticationCertNumber: authenticationCertNumber || null,
      signed: signed || false, inscription: inscription || null, gameUsed: gameUsed || false,
      limitedEdition: limitedEdition || false, editionNumber: editionNumber || null, totalEditionSize: totalEditionSize ? parseInt(totalEditionSize) : null,
      dimensions: dimensions || null, material: material || null, provenanceNotes: provenanceNotes || null,
    },
  });

  return NextResponse.json({ item, collectible }, { status: 201 });
}
