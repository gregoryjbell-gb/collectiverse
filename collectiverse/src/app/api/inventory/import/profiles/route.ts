import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, ensureUserId } from '@/lib/auth';

// Default system profiles for known apps
const SYSTEM_PROFILES: Record<string, Record<string, string>> = {
  LUDEX: { 'Player': 'subjectName', 'Team': 'team', 'Year': 'year', 'Set': 'setName', 'Card #': 'cardNumber', 'Parallel': 'parallel', 'Condition': 'condition', 'Grade': 'gradeValue', 'Grading Company': 'gradeCompany', 'Cert #': 'certNumber', 'Purchase Price': 'purchasePrice', 'Estimated Value': 'estimatedValue', 'Notes': 'notes', 'Quantity': 'quantity' },
  COLLECTR: { 'Name': 'subjectName', 'Team': 'team', 'Year': 'year', 'Set Name': 'setName', 'Number': 'cardNumber', 'Variant': 'parallel', 'Condition': 'condition', 'Grade': 'gradeValue', 'Grader': 'gradeCompany', 'Cert': 'certNumber', 'Cost': 'purchasePrice', 'Value': 'estimatedValue', 'Location': 'storageLocation', 'Notes': 'notes' },
  COLLX: { 'Player Name': 'subjectName', 'Team Name': 'team', 'Year': 'year', 'Set': 'setName', 'Card Number': 'cardNumber', 'Parallel/Variation': 'parallel', 'Condition': 'condition', 'Grade Value': 'gradeValue', 'Grade Company': 'gradeCompany', 'Cert Number': 'certNumber', 'Purchase Price': 'purchasePrice', 'Current Value': 'estimatedValue', 'Qty': 'quantity', 'Notes': 'notes' },
  CARDLY_AI: { 'Subject': 'subjectName', 'Team': 'team', 'Year': 'year', 'Product': 'setName', 'Card No': 'cardNumber', 'Parallel': 'parallel', 'Variation': 'variation', 'Condition': 'condition', 'Grade': 'gradeValue', 'Company': 'gradeCompany', 'Cert': 'certNumber', 'Paid': 'purchasePrice', 'Value': 'estimatedValue', 'Sport': 'sport', 'Manufacturer': 'manufacturer' },
  CARD_GRADER: { 'Player': 'subjectName', 'Team': 'team', 'Year': 'year', 'Set': 'setName', 'Card #': 'cardNumber', 'Parallel': 'parallel', 'Raw/Graded': 'condition', 'Grade': 'gradeValue', 'Grading Co': 'gradeCompany', 'Cert Number': 'certNumber', 'Cost Basis': 'purchasePrice', 'Market Value': 'estimatedValue', 'Storage': 'storageLocation' },
};

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  // Get system profiles + user's custom profiles
  const profiles = await (prisma as any).inventoryImportProfile.findMany({
    where: { OR: [{ systemProfile: true }, { userId }] },
    orderBy: [{ systemProfile: 'desc' }, { name: 'asc' }],
  });

  return NextResponse.json({ profiles, systemMappings: SYSTEM_PROFILES });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await ensureUserId(session);

  const body = await req.json();
  const { name, sourceApp, columnMappings, sampleHeaders } = body;

  if (!name || !columnMappings) {
    return NextResponse.json({ error: 'name and columnMappings are required' }, { status: 400 });
  }

  const profile = await (prisma as any).inventoryImportProfile.create({
    data: {
      userId,
      name,
      sourceApp: sourceApp || 'CUSTOM',
      systemProfile: false,
      columnMappings: JSON.stringify(columnMappings),
      sampleHeaders: sampleHeaders ? JSON.stringify(sampleHeaders) : null,
    },
  });

  return NextResponse.json({ profile }, { status: 201 });
}
