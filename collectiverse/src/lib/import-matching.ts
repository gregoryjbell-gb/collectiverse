import { prisma } from './prisma';
import { generateCardFingerprint, normalizeManufacturer, normalizeSetName, normalizeSubjectName } from './card-fingerprint';

export type MatchStatus = 'EXACT_MATCH' | 'HIGH_CONFIDENCE' | 'POSSIBLE_MATCH' | 'NO_MATCH';

export interface MatchResult {
  status: MatchStatus;
  confidence: number;
  cardId: string | null;
  candidates: Array<{ cardId: string; confidence: number; label: string }>;
}

/**
 * Normalize an import row's fields for matching.
 */
export function normalizeImportRow(row: any): any {
  return {
    year: row.year ? String(row.year).trim() : '',
    manufacturer: row.manufacturer ? normalizeManufacturer(row.manufacturer) : '',
    setName: row.setName ? normalizeSetName(row.setName) : '',
    cardNumber: (row.cardNumber || '').toLowerCase().trim(),
    subjectName: row.subjectName ? normalizeSubjectName(row.subjectName) : '',
    team: (row.team || '').toLowerCase().trim(),
    parallel: (row.parallel || '').toLowerCase().trim(),
    variation: (row.variation || '').toLowerCase().trim(),
    sport: (row.sport || '').toLowerCase().trim(),
    cardCategory: (row.cardCategory || '').toLowerCase().trim(),
  };
}

/**
 * Generate a fingerprint from an import row.
 */
export function generateImportFingerprint(row: any): string {
  return generateCardFingerprint({
    year: row.year, manufacturer: row.manufacturer, setName: row.setName,
    cardNumber: row.cardNumber, subjectName: row.subjectName,
    parallel: row.parallel, variation: row.variation,
  });
}

/**
 * Find an exact card match by fingerprint.
 */
export async function findExactCardMatch(row: any): Promise<string | null> {
  const fingerprint = generateImportFingerprint(row);
  const identity = await (prisma as any).cardIdentity.findUnique({ where: { fingerprint } });
  return identity?.canonicalCardId || null;
}

/**
 * Find likely card matches using fuzzy criteria.
 */
export async function findLikelyCardMatches(row: any): Promise<Array<{ cardId: string; confidence: number; label: string }>> {
  const candidates: Array<{ cardId: string; confidence: number; label: string }> = [];
  const normalized = normalizeImportRow(row);

  // Strategy 1: Match by person name + card number
  if (normalized.subjectName && normalized.cardNumber) {
    const persons = await (prisma as any).person.findMany({
      where: { displayName: { contains: row.subjectName, mode: 'insensitive' } },
      take: 5,
    });
    for (const person of persons) {
      const cards = await (prisma as any).card.findMany({
        where: { personId: person.id, cardNumber: normalized.cardNumber },
        include: { set: { select: { name: true, year: true } } },
        take: 3,
      });
      for (const card of cards) {
        const conf = calculateMatchConfidence(row, {
          year: card.year, setName: card.set?.name, cardNumber: card.cardNumber,
          subjectName: person.displayName, parallel: card.parallel,
        });
        if (conf >= 60) {
          candidates.push({
            cardId: card.id,
            confidence: conf,
            label: `${person.displayName} - ${card.set?.name || '?'} #${card.cardNumber} (${card.year || '?'})`,
          });
        }
      }
    }
  }

  // Strategy 2: Match by set + card number
  if (normalized.setName && normalized.cardNumber) {
    const sets = await (prisma as any).cardSet.findMany({
      where: { name: { contains: row.setName, mode: 'insensitive' } },
      take: 3,
    });
    for (const set of sets) {
      const cards = await (prisma as any).card.findMany({
        where: { setId: set.id, cardNumber: normalized.cardNumber },
        include: { person: { select: { displayName: true } } },
        take: 3,
      });
      for (const card of cards) {
        // Avoid duplicates
        if (candidates.some(c => c.cardId === card.id)) continue;
        const conf = calculateMatchConfidence(row, {
          year: set.year, setName: set.name, cardNumber: card.cardNumber,
          subjectName: card.person?.displayName, parallel: card.parallel,
        });
        if (conf >= 60) {
          candidates.push({
            cardId: card.id,
            confidence: conf,
            label: `${card.person?.displayName || '?'} - ${set.name} #${card.cardNumber} (${set.year})`,
          });
        }
      }
    }
  }

  // Sort by confidence descending
  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates.slice(0, 5);
}

/**
 * Calculate match confidence between an import row and a card's data.
 */
export function calculateMatchConfidence(row: any, card: any): number {
  let score = 0;
  let maxScore = 0;

  const normalized = normalizeImportRow(row);
  const cardNorm = {
    year: String(card.year || ''),
    setName: card.setName ? normalizeSetName(card.setName) : '',
    cardNumber: (card.cardNumber || '').toLowerCase().trim(),
    subjectName: card.subjectName ? normalizeSubjectName(card.subjectName) : '',
    parallel: (card.parallel || '').toLowerCase().trim(),
  };

  // Year match (weight: 15)
  if (normalized.year || cardNorm.year) {
    maxScore += 15;
    if (normalized.year === cardNorm.year) score += 15;
  }

  // Set name match (weight: 20)
  if (normalized.setName || cardNorm.setName) {
    maxScore += 20;
    if (normalized.setName === cardNorm.setName) score += 20;
    else if (normalized.setName && cardNorm.setName && (normalized.setName.includes(cardNorm.setName) || cardNorm.setName.includes(normalized.setName))) score += 12;
  }

  // Card number match (weight: 25)
  if (normalized.cardNumber || cardNorm.cardNumber) {
    maxScore += 25;
    if (normalized.cardNumber === cardNorm.cardNumber) score += 25;
  }

  // Subject name match (weight: 30)
  if (normalized.subjectName || cardNorm.subjectName) {
    maxScore += 30;
    if (normalized.subjectName === cardNorm.subjectName) score += 30;
    else if (normalized.subjectName && cardNorm.subjectName) {
      // Partial name match
      const rowParts = normalized.subjectName.split(' ');
      const cardParts = cardNorm.subjectName.split(' ');
      const matchingParts = rowParts.filter((p: string) => cardParts.includes(p));
      const partialScore = (matchingParts.length / Math.max(rowParts.length, cardParts.length)) * 30;
      score += Math.round(partialScore);
    }
  }

  // Parallel match (weight: 10)
  if (normalized.parallel || cardNorm.parallel) {
    maxScore += 10;
    if (normalized.parallel === cardNorm.parallel) score += 10;
    else if (!normalized.parallel && !cardNorm.parallel) score += 10;
  }

  if (maxScore === 0) return 0;
  return Math.round((score / maxScore) * 100);
}

/**
 * Classify an import row's match quality.
 */
export async function classifyImportMatch(row: any): Promise<MatchResult> {
  // Try exact fingerprint match first
  const exactId = await findExactCardMatch(row);
  if (exactId) {
    return { status: 'EXACT_MATCH', confidence: 100, cardId: exactId, candidates: [] };
  }

  // Try fuzzy matches
  const candidates = await findLikelyCardMatches(row);

  if (candidates.length === 0) {
    return { status: 'NO_MATCH', confidence: 0, cardId: null, candidates: [] };
  }

  const best = candidates[0];

  if (best.confidence >= 95) {
    return { status: 'EXACT_MATCH', confidence: best.confidence, cardId: best.cardId, candidates };
  }
  if (best.confidence >= 85) {
    return { status: 'HIGH_CONFIDENCE', confidence: best.confidence, cardId: best.cardId, candidates };
  }
  if (best.confidence >= 60) {
    return { status: 'POSSIBLE_MATCH', confidence: best.confidence, cardId: best.cardId, candidates };
  }

  return { status: 'NO_MATCH', confidence: best.confidence, cardId: null, candidates };
}
