import { prisma } from './prisma';

/**
 * Record a card fact from a specific source.
 */
export async function recordCardFact(cardId: string, fieldName: string, fieldValue: string, sourceId: string): Promise<any> {
  // Check if this exact fact already exists
  const existing = await (prisma as any).cardFact.findFirst({
    where: { cardId, fieldName, fieldValue, sourceId },
  });
  if (existing) return existing;

  // Get source trust score
  const source = await (prisma as any).dataSource.findUnique({ where: { id: sourceId } });
  const trustScore = source?.trustScore || 0.5;

  const fact = await (prisma as any).cardFact.create({
    data: {
      cardId,
      fieldName,
      fieldValue,
      sourceId,
      confidenceScore: trustScore,
      verificationStatus: 'UNVERIFIED',
    },
  });

  // After recording, check if other sources agree
  await updateFactConfidence(cardId, fieldName);

  return fact;
}

/**
 * Compare all facts for a card and identify agreements/conflicts.
 */
export async function compareFacts(cardId: string): Promise<{ agreements: any[]; conflicts: any[] }> {
  const facts = await (prisma as any).cardFact.findMany({
    where: { cardId },
    include: { source: { select: { name: true, trustScore: true, sourceReliability: true } } },
    orderBy: { fieldName: 'asc' },
  });

  const byField: Record<string, any[]> = {};
  for (const fact of facts) {
    if (!byField[fact.fieldName]) byField[fact.fieldName] = [];
    byField[fact.fieldName].push(fact);
  }

  const agreements: any[] = [];
  const conflicts: any[] = [];

  for (const [fieldName, fieldFacts] of Object.entries(byField)) {
    const values = Array.from(new Set(fieldFacts.map((f: any) => f.fieldValue)));
    if (values.length === 1) {
      agreements.push({ fieldName, value: values[0], sources: fieldFacts.length, facts: fieldFacts });
    } else {
      conflicts.push({ fieldName, values, facts: fieldFacts });
    }
  }

  return { agreements, conflicts };
}

/**
 * Calculate and update confidence scores for all facts of a card field.
 */
export async function updateFactConfidence(cardId: string, fieldName: string): Promise<void> {
  const facts = await (prisma as any).cardFact.findMany({
    where: { cardId, fieldName },
    include: { source: true },
  });

  if (facts.length === 0) return;

  // Group by value
  const byValue: Record<string, any[]> = {};
  for (const fact of facts) {
    if (!byValue[fact.fieldValue]) byValue[fact.fieldValue] = [];
    byValue[fact.fieldValue].push(fact);
  }

  const values = Object.keys(byValue);
  const isConflicted = values.length > 1;

  for (const [value, valueFacts] of Object.entries(byValue)) {
    // Confidence = average trust of agreeing sources * agreement ratio
    const avgTrust = valueFacts.reduce((sum: number, f: any) => sum + (f.source?.trustScore || 0.5), 0) / valueFacts.length;
    const agreementRatio = valueFacts.length / facts.length;
    const confidence = Math.min(avgTrust * agreementRatio * (isConflicted ? 0.8 : 1.2), 1.0);

    let status = 'UNVERIFIED';
    if (isConflicted) {
      status = 'CONFLICTED';
    } else if (valueFacts.length >= 3) {
      status = 'MULTI_SOURCE_VERIFIED';
    } else if (valueFacts.length >= 1 && avgTrust >= 0.7) {
      status = 'SOURCE_SUPPORTED';
    }

    // Don't downgrade ADMIN_VERIFIED
    for (const fact of valueFacts) {
      if (fact.verificationStatus === 'ADMIN_VERIFIED') continue;
      await (prisma as any).cardFact.update({
        where: { id: fact.id },
        data: { confidenceScore: Math.round(confidence * 100) / 100, verificationStatus: status },
      });
    }
  }
}

/**
 * Calculate overall confidence score for a card.
 */
export async function calculateCardConfidence(cardId: string): Promise<number> {
  const facts = await (prisma as any).cardFact.findMany({ where: { cardId } });
  if (facts.length === 0) return 0;
  const avg = facts.reduce((sum: number, f: any) => sum + f.confidenceScore, 0) / facts.length;
  return Math.round(avg * 100) / 100;
}

/**
 * Flag all conflicting facts for a card.
 */
export async function flagConflicts(cardId: string): Promise<string[]> {
  const { conflicts } = await compareFacts(cardId);
  const conflictedFields: string[] = [];

  for (const conflict of conflicts) {
    conflictedFields.push(conflict.fieldName);
    for (const fact of conflict.facts) {
      if (fact.verificationStatus !== 'ADMIN_VERIFIED') {
        await (prisma as any).cardFact.update({
          where: { id: fact.id },
          data: { verificationStatus: 'CONFLICTED' },
        });
      }
    }
  }

  return conflictedFields;
}

/**
 * Record multiple facts from a CSV import row.
 */
export async function recordImportFacts(cardId: string, sourceId: string, row: Record<string, string>): Promise<void> {
  const factFields = ['subjectName', 'team', 'cardNumber', 'year', 'parallel', 'rookie', 'autograph', 'relic', 'serialNumber', 'printRun'];

  for (const field of factFields) {
    if (row[field] && row[field].trim()) {
      await recordCardFact(cardId, field, row[field].trim(), sourceId);
    }
  }
}
