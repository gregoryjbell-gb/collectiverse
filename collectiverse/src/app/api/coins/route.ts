import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const coinType = searchParams.get('coinType');
  const country = searchParams.get('country');

  const where: any = {};
  if (q) where.OR = [{ denomination: { contains: q, mode: 'insensitive' } }, { seriesName: { contains: q, mode: 'insensitive' } }, { country: { contains: q, mode: 'insensitive' } }];
  if (coinType) where.coinType = coinType;
  if (country) where.country = { contains: country, mode: 'insensitive' };

  const coins = await (prisma as any).coinCollectible.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ coins });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { coinType, country, denomination, year, mintMark, mintLocation, seriesName, composition, weight, diameter, fineness, designer, mintage, proof, errorCoin, errorDescription, certificationCompany, certificationNumber, gradeValue } = body;
  if (!coinType || !country) return NextResponse.json({ error: 'coinType and country required' }, { status: 400 });

  const title = [year, mintMark, denomination, seriesName || country].filter(Boolean).join(' ');
  const subtitle = [mintLocation ? `${mintLocation} Mint` : null, certificationCompany, gradeValue].filter(Boolean).join(' • ') || null;

  const collectible = await (prisma as any).collectible.create({
    data: { collectibleType: 'COIN', title, subtitle, year: year ? parseInt(year) : null, manufacturer: mintLocation || country, status: 'ACTIVE' },
  });

  const coin = await (prisma as any).coinCollectible.create({
    data: {
      collectibleId: collectible.id, coinType, country, denomination: denomination || null,
      year: year ? parseInt(year) : null, mintMark: mintMark || null, mintLocation: mintLocation || null,
      seriesName: seriesName || null, composition: composition || null, weight: weight || null,
      diameter: diameter || null, fineness: fineness || null, designer: designer || null,
      mintage: mintage ? parseInt(mintage) : null, proof: proof || false,
      errorCoin: errorCoin || false, errorDescription: errorDescription || null,
      certificationCompany: certificationCompany || null, certificationNumber: certificationNumber || null,
      gradeValue: gradeValue || null,
    },
  });

  return NextResponse.json({ coin, collectible }, { status: 201 });
}
