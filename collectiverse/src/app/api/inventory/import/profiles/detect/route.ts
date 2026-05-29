import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// Known header patterns for each app
const APP_SIGNATURES: Record<string, string[]> = {
  LUDEX: ['Player', 'Card #', 'Grading Company'],
  COLLECTR: ['Set Name', 'Variant', 'Grader'],
  COLLX: ['Player Name', 'Card Number', 'Grade Company', 'Team Name'],
  CARDLY_AI: ['Subject', 'Card No', 'Company', 'Product'],
  CARD_GRADER: ['Raw/Graded', 'Grading Co', 'Cost Basis', 'Market Value'],
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { headers } = body;

  if (!headers || !Array.isArray(headers)) {
    return NextResponse.json({ error: 'headers array is required' }, { status: 400 });
  }

  const normalizedHeaders = headers.map((h: string) => h.toLowerCase().trim());

  // Score each app by how many signature headers match
  let bestApp = 'GENERIC';
  let bestScore = 0;

  for (const [app, signatures] of Object.entries(APP_SIGNATURES)) {
    const matchCount = signatures.filter(sig =>
      normalizedHeaders.some((h: string) => h === sig.toLowerCase() || h.includes(sig.toLowerCase()))
    ).length;
    const score = matchCount / signatures.length;
    if (score > bestScore) {
      bestScore = score;
      bestApp = app;
    }
  }

  // Only suggest if confidence is reasonable
  if (bestScore < 0.5) bestApp = 'GENERIC';

  return NextResponse.json({ detectedApp: bestApp, confidence: Math.round(bestScore * 100) });
}
