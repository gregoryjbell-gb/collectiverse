import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_TYPES = [
  { name: 'Sports Card', slug: 'sports_card', description: 'Football, basketball, baseball, hockey, soccer trading cards' },
  { name: 'TCG Card', slug: 'tcg_card', description: 'Pokémon, Magic: The Gathering, Yu-Gi-Oh, and other trading card games' },
  { name: 'Non-Sports Card', slug: 'non_sports_card', description: 'Entertainment, movie, TV, music, and celebrity cards' },
  { name: 'Comic Book', slug: 'comic', description: 'Single issues, graphic novels, variants, and graded comics' },
  { name: 'Memorabilia', slug: 'memorabilia', description: 'Autographed items, game-used gear, and authenticated pieces' },
  { name: 'Toy / Figure', slug: 'toy', description: 'Action figures, statues, Funko Pops, and collectible toys' },
  { name: 'Coin', slug: 'coin', description: 'Coins, bullion, tokens, medals, and numismatic items' },
  { name: 'Autograph', slug: 'autograph', description: 'Standalone signed items and cut signatures' },
  { name: 'Sealed Product', slug: 'sealed_product', description: 'Sealed boxes, packs, cases, and hobby products' },
  { name: 'Ticket', slug: 'ticket', description: 'Event tickets, stubs, passes, and commemorative admissions' },
  { name: 'Other', slug: 'other', description: 'Any other collectible not covered by existing categories' },
];

export async function GET() {
  let types = await (prisma as any).collectibleType.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });

  // Seed if empty
  if (types.length === 0) {
    for (const t of DEFAULT_TYPES) {
      await (prisma as any).collectibleType.create({ data: t }).catch(() => {});
    }
    types = await (prisma as any).collectibleType.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  return NextResponse.json({ types });
}
