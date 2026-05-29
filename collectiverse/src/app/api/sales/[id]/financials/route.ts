import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const sale = await (prisma as any).sale.findUnique({
    where: { id: params.id },
    include: { expenses: true },
  });
  if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
  if (sale.sellerUserId !== userId && sale.buyerUserId !== userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ financials: buildFinancials(sale) });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const sale = await (prisma as any).sale.findUnique({ where: { id: params.id } });
  if (!sale) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
  if (sale.sellerUserId !== userId && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const allowed = ['platformFees', 'paymentProcessingFee', 'shippingCost', 'insuranceCost', 'suppliesCost', 'taxCollected', 'taxRemitted', 'otherCosts', 'costBasis'];
  const data: any = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key] !== null ? parseFloat(body[key]) : null;
  }

  // Recalculate derived fields
  const salePrice = body.salePrice !== undefined ? parseFloat(body.salePrice) : (sale.salePrice || 0);
  const shippingCharged = sale.shippingPrice || 0;
  const taxCollected = data.taxCollected !== undefined ? data.taxCollected : (sale.taxCollected || 0);
  const grossAmount = salePrice + shippingCharged + (taxCollected || 0);

  const pFees = data.platformFees !== undefined ? data.platformFees : (sale.platformFees || 0);
  const ppFee = data.paymentProcessingFee !== undefined ? data.paymentProcessingFee : (sale.paymentProcessingFee || 0);
  const sCost = data.shippingCost !== undefined ? data.shippingCost : (sale.shippingCost || 0);
  const iCost = data.insuranceCost !== undefined ? data.insuranceCost : (sale.insuranceCost || 0);
  const suCost = data.suppliesCost !== undefined ? data.suppliesCost : (sale.suppliesCost || 0);
  const oCost = data.otherCosts !== undefined ? data.otherCosts : (sale.otherCosts || 0);
  const totalCosts = (pFees || 0) + (ppFee || 0) + (sCost || 0) + (iCost || 0) + (suCost || 0) + (oCost || 0);

  const netProceeds = grossAmount - totalCosts;
  const costBasis = data.costBasis !== undefined ? data.costBasis : (sale.costBasis || 0);
  const realizedGainLoss = netProceeds - (costBasis || 0);
  const roiPercent = costBasis && costBasis > 0 ? (realizedGainLoss / costBasis) * 100 : null;

  data.netProceeds = netProceeds;
  data.realizedGainLoss = realizedGainLoss;
  data.roiPercent = roiPercent !== null ? Math.round(roiPercent * 100) / 100 : null;

  const updated = await (prisma as any).sale.update({ where: { id: params.id }, data });
  const withExpenses = await (prisma as any).sale.findUnique({ where: { id: params.id }, include: { expenses: true } });

  return NextResponse.json({ financials: buildFinancials(withExpenses) });
}

function buildFinancials(sale: any) {
  const salePrice = sale.salePrice || 0;
  const shippingCharged = sale.shippingPrice || 0;
  const taxCollected = sale.taxCollected || 0;
  const grossAmount = salePrice + shippingCharged + taxCollected;
  const totalCosts = (sale.platformFees || 0) + (sale.paymentProcessingFee || 0) + (sale.shippingCost || 0) + (sale.insuranceCost || 0) + (sale.suppliesCost || 0) + (sale.otherCosts || 0);
  const netProceeds = sale.netProceeds ?? (grossAmount - totalCosts);
  const costBasis = sale.costBasis || 0;
  const realizedGainLoss = sale.realizedGainLoss ?? (netProceeds - costBasis);
  const roiPercent = sale.roiPercent ?? (costBasis > 0 ? ((realizedGainLoss / costBasis) * 100) : null);

  return {
    salePrice,
    shippingCharged,
    taxCollected,
    grossAmount,
    platformFees: sale.platformFees || 0,
    paymentProcessingFee: sale.paymentProcessingFee || 0,
    shippingCost: sale.shippingCost || 0,
    insuranceCost: sale.insuranceCost || 0,
    suppliesCost: sale.suppliesCost || 0,
    otherCosts: sale.otherCosts || 0,
    totalCosts,
    netProceeds,
    costBasis,
    realizedGainLoss,
    roiPercent: roiPercent !== null ? Math.round(roiPercent * 100) / 100 : null,
    taxRemitted: sale.taxRemitted || 0,
    expenses: sale.expenses || [],
  };
}
