import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const musicType = searchParams.get('musicType');

  const where: any = {};
  if (q) where.OR = [{ artistName: { contains: q, mode: 'insensitive' } }, { albumTitle: { contains: q, mode: 'insensitive' } }, { label: { contains: q, mode: 'insensitive' } }];
  if (musicType) where.musicType = musicType;

  const items = await (prisma as any).musicCollectible.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { musicType, artistName, albumTitle, releaseTitle, label, catalogNumber, format, pressing, country, releaseYear, genre, signed, limitedEdition, coloredVinyl, variantName, upc, conditionMedia, conditionSleeve, gradingCompany, gradeValue, certificationNumber } = body;
  if (!artistName) return NextResponse.json({ error: 'artistName required' }, { status: 400 });

  const title = albumTitle ? `${artistName} — ${albumTitle}` : artistName;
  const subtitle = [releaseYear, label, format, pressing].filter(Boolean).join(' • ') || null;

  const collectible = await (prisma as any).collectible.create({
    data: { collectibleType: 'MUSIC', title, subtitle, year: releaseYear ? parseInt(releaseYear) : null, manufacturer: label || null, franchise: artistName, status: 'ACTIVE' },
  });

  const item = await (prisma as any).musicCollectible.create({
    data: {
      collectibleId: collectible.id, musicType: musicType || 'VINYL', artistName,
      albumTitle: albumTitle || null, releaseTitle: releaseTitle || null, label: label || null,
      catalogNumber: catalogNumber || null, format: format || null, pressing: pressing || null,
      country: country || null, releaseYear: releaseYear ? parseInt(releaseYear) : null, genre: genre || null,
      signed: signed || false, limitedEdition: limitedEdition || false, coloredVinyl: coloredVinyl || false,
      variantName: variantName || null, upc: upc || null,
      conditionMedia: conditionMedia || null, conditionSleeve: conditionSleeve || null,
      gradingCompany: gradingCompany || null, gradeValue: gradeValue || null, certificationNumber: certificationNumber || null,
    },
  });

  return NextResponse.json({ item, collectible }, { status: 201 });
}
