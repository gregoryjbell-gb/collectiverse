import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const metadata = { title: 'Sets — Collectiverse' };

export default async function SetsPage() {
  const sets = await prisma.cardSet.findMany({
    include: { sport: true, _count: { select: { cards: true } } },
    orderBy: { year: 'desc' },
  });

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Card Sets</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sets.map((set) => (
            <Link key={set.id} href={`/sets/${set.id}`} className="card-surface p-5 hover:border-electric/30 transition-colors group">
              <h2 className="font-semibold group-hover:text-electric transition-colors">{set.name}</h2>
              <p className="text-sm text-silver mt-1">{set.manufacturer} • {set.year}</p>
              <div className="flex gap-2 mt-3">
                {set.sport && <span className="badge bg-electric/20 text-electric">{set.sport.name}</span>}
                <span className="badge bg-silver/10 text-silver">{set._count.cards} cards</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
