import { prisma } from './prisma';

/**
 * Normalize manufacturer name for fingerprinting.
 */
export function normalizeManufacturer(manufacturer: string): string {
  return manufacturer
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b(inc|llc|corp|co|ltd)\b/g, '')
    .trim();
}

/**
 * Normalize set name for fingerprinting.
 */
export function normalizeSetName(setName: string): string {
  return setName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b(series|edition|set|collection)\b/g, '')
    .trim();
}

/**
 * Normalize subject/player name for fingerprinting.
 */
export function normalizeSubjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, (m) => m) // keep suffixes
    .trim();
}

/**
 * Generate a canonical fingerprint for a card.
 * Format: year|manufacturer|setName|cardNumber|subjectName|parallel|variation
 */
export function generateCardFingerprint(params: {
  year?: number | string | null;
  manufacturer?: string | null;
  setName?: string | null;
  cardNumber?: string | null;
  subjectName?: string | null;
  parallel?: string | null;
  variation?: string | null;
}): string {
  const parts = [
    String(params.year || ''),
    normalizeManufacturer(params.manufacturer || ''),
    normalizeSetName(params.setName || ''),
    (params.cardNumber || '').toLowerCase().trim(),
    normalizeSubjectName(params.subjectName || ''),
    (params.parallel || '').toLowerCase().trim(),
    (params.variation || '').toLowerCase().trim(),
  ];
  return parts.join('|');
}

/**
 * Generate a normalized fingerprint (without parallel/variation for base matching).
 */
export function generateNormalizedFingerprint(params: {
  year?: number | string | null;
  manufacturer?: string | null;
  setName?: string | null;
  cardNumber?: string | null;
  subjectName?: string | null;
}): string {
  const parts = [
    String(params.year || ''),
    normalizeManufacturer(params.manufacturer || ''),
    normalizeSetName(params.setName || ''),
    (params.cardNumber || '').toLowerCase().trim(),
    normalizeSubjectName(params.subjectName || ''),
  ];
  return parts.join('|');
}

/**
 * Find or create a CardIdentity for a card.
 * Returns { identity, isNew, existingCardId? }
 */
export async function findOrCreateIdentity(params: {
  cardId: string;
  year?: number | null;
  manufacturer?: string | null;
  setName?: string | null;
  cardNumber?: string | null;
  subjectName?: string | null;
  parallel?: string | null;
  variation?: string | null;
  brand?: string | null;
}): Promise<{ identity: any; isNew: boolean; existingCardId?: string }> {
  const fingerprint = generateCardFingerprint(params);
  const normalizedFingerprint = generateNormalizedFingerprint(params);

  // Check exact fingerprint match
  const existing = await (prisma as any).cardIdentity.findUnique({ where: { fingerprint } });
  if (existing) {
    return { identity: existing, isNew: false, existingCardId: existing.canonicalCardId };
  }

  // Check normalized fingerprint (base card match without parallel/variation)
  const normalizedMatch = await (prisma as any).cardIdentity.findUnique({ where: { normalizedFingerprint } });
  if (normalizedMatch && !params.parallel && !params.variation) {
    // Same base card, no parallel/variation difference — it's a duplicate
    return { identity: normalizedMatch, isNew: false, existingCardId: normalizedMatch.canonicalCardId };
  }

  // Create new identity
  const identity = await (prisma as any).cardIdentity.create({
    data: {
      canonicalCardId: params.cardId,
      fingerprint,
      normalizedFingerprint: params.parallel || params.variation ? `${normalizedFingerprint}|${params.parallel || ''}|${params.variation || ''}` : normalizedFingerprint,
      year: params.year ? Number(params.year) : null,
      manufacturer: params.manufacturer || null,
      brand: params.brand || null,
      setName: params.setName || null,
      cardNumber: params.cardNumber || null,
      subjectName: params.subjectName || null,
      parallel: params.parallel || null,
      variation: params.variation || null,
    },
  });

  return { identity, isNew: true };
}

/**
 * Check if a card with this fingerprint already exists.
 * Returns the existing card ID if found, null otherwise.
 */
export async function checkExistingCard(params: {
  year?: number | string | null;
  manufacturer?: string | null;
  setName?: string | null;
  cardNumber?: string | null;
  subjectName?: string | null;
  parallel?: string | null;
  variation?: string | null;
}): Promise<string | null> {
  const fingerprint = generateCardFingerprint(params);
  const existing = await (prisma as any).cardIdentity.findUnique({ where: { fingerprint } });
  return existing?.canonicalCardId || null;
}

/**
 * Find similar cards by normalized fingerprint (potential duplicates).
 */
export async function findSimilarCards(params: {
  year?: number | string | null;
  manufacturer?: string | null;
  setName?: string | null;
  cardNumber?: string | null;
  subjectName?: string | null;
}): Promise<any[]> {
  const normalized = generateNormalizedFingerprint(params);

  // Find identities that share the same base fingerprint components
  const similar = await (prisma as any).cardIdentity.findMany({
    where: {
      OR: [
        { normalizedFingerprint: { startsWith: normalized } },
        { year: params.year ? Number(params.year) : undefined, cardNumber: params.cardNumber, subjectName: { contains: params.subjectName || '', mode: 'insensitive' } },
      ],
    },
    take: 10,
  });

  return similar;
}

/**
 * Record a card source (provenance tracking).
 */
export async function recordCardSource(params: {
  cardId: string;
  sourceId?: string | null;
  sourceRecordId?: string | null;
  sourceName: string;
  sourceUrl?: string | null;
}): Promise<any> {
  return (prisma as any).cardSource.create({
    data: {
      cardId: params.cardId,
      sourceId: params.sourceId || null,
      sourceRecordId: params.sourceRecordId || null,
      sourceName: params.sourceName,
      sourceUrl: params.sourceUrl || null,
    },
  });
}
