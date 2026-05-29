import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const platform = searchParams.get('platform');

  const where: any = {};
  if (q) where.OR = [{ title: { contains: q, mode: 'insensitive' } }, { publisher: { contains: q, mode: 'insensitive' } }, { developer: { contains: q, mode: 'insensitive' } }];
  if (platform) where.platform = { contains: platform, mode: 'insensitive' };

  const games = await (prisma as any).videoGameCollectible.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ games });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { itemType, title, platform, publisher, developer, region, releaseYear, format, sealed, completeInBox, includesManual, variantName, editionName, upc, gradingCompany, gradeValue, certificationNumber } = body;
  if (!title || !platform) return NextResponse.json({ error: 'title and platform required' }, { status: 400 });

  const subtitle = [platform, completeInBox ? 'CIB' : sealed ? 'Sealed' : null, editionName].filter(Boolean).join(' — ') || null;

  const collectible = await (prisma as any).collectible.create({
    data: { collectibleType: 'VIDEO_GAME', title, subtitle, year: releaseYear ? parseInt(releaseYear) : null, manufacturer: publisher || null, status: 'ACTIVE' },
  });

  const game = await (prisma as any).videoGameCollectible.create({
    data: {
      collectibleId: collectible.id, itemType: itemType || 'GAME', title, platform,
      publisher: publisher || null, developer: developer || null, region: region || 'NTSC_U',
      releaseYear: releaseYear ? parseInt(releaseYear) : null, format: format || 'CARTRIDGE',
      sealed: sealed || false, completeInBox: completeInBox || false, includesManual: includesManual || false,
      variantName: variantName || null, editionName: editionName || null, upc: upc || null,
      gradingCompany: gradingCompany || null, gradeValue: gradeValue || null, certificationNumber: certificationNumber || null,
    },
  });

  return NextResponse.json({ game, collectible }, { status: 201 });
}
