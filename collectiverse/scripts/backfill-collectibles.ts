/**
 * Backfill script: Creates Collectible records for existing Cards and links them.
 * Run with: npx ts-node scripts/backfill-collectibles.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting collectible backfill...');

  // Find all cards without a collectibleId
  const cards = await (prisma as any).card.findMany({
    where: { collectibleId: null },
    include: { person: { select: { displayName: true } }, set: { select: { name: true, year: true, manufacturer: true } } },
  });

  console.log(`Found ${cards.length} cards without collectibleId`);

  let created = 0;
  for (const card of cards) {
    const title = [
      card.person?.displayName || card.subjectName || card.characterName || 'Unknown',
      card.set?.name || '',
      card.cardNumber ? `#${card.cardNumber}` : '',
    ].filter(Boolean).join(' — ');

    const collectibleType = card.cardCategory === 'TCG' ? 'TCG_CARD'
      : card.cardCategory === 'ENTERTAINMENT' || card.cardCategory === 'MOVIE_TV' ? 'NON_SPORTS_CARD'
      : 'SPORTS_CARD';

    try {
      const collectible = await (prisma as any).collectible.create({
        data: {
          collectibleType,
          title,
          subtitle: card.parallel || null,
          year: card.year || card.set?.year || null,
          manufacturer: card.set?.manufacturer || null,
          franchise: card.franchise || null,
          primaryImageUrl: card.frontImageUrl || null,
          status: 'ACTIVE',
          cardId: card.id,
        },
      });

      await (prisma as any).card.update({
        where: { id: card.id },
        data: { collectibleId: collectible.id },
      });

      created++;
      if (created % 100 === 0) console.log(`  Created ${created} collectibles...`);
    } catch (err: any) {
      console.error(`  Error for card ${card.id}: ${err.message}`);
    }
  }

  console.log(`Created ${created} collectibles for cards.`);

  // Backfill InventoryItem.collectibleId
  const items = await (prisma as any).inventoryItem.findMany({
    where: { collectibleId: null, cardId: { not: null } },
    select: { id: true, cardId: true },
  });

  console.log(`Found ${items.length} inventory items without collectibleId`);

  let linked = 0;
  for (const item of items) {
    const card = await (prisma as any).card.findUnique({ where: { id: item.cardId }, select: { collectibleId: true } });
    if (card?.collectibleId) {
      await (prisma as any).inventoryItem.update({ where: { id: item.id }, data: { collectibleId: card.collectibleId } });
      linked++;
    }
  }

  console.log(`Linked ${linked} inventory items to collectibles.`);
  console.log('Backfill complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
