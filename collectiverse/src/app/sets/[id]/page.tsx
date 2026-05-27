import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

interface Props { params: { id: string } }

export default async function SetPage({ params }: Props) {
  const set = await prisma.cardSet.findUnique({
    where: { id: params.id },
    include: {
      sport: true,
      cards: { include: { person: true, team: true }, orderBy: { cardNumber: 'asc' } },
    },
  });

  if (!set) notFound();

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/sets" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back to Sets</Link>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{set.name}</h1>
          <p className="text-silver">{set.manufacturer} • {set.year} {set.sport && `• ${set.sport.name}`}</p>
        </div>
        <p className="text-silver text-sm mb-6">{set.cards.length} cards</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {set.cards.map((card) => (
            <Link key={card.id} href={`/cards/${card.id}`} className="card-surface p-4 hover:border-electric/30 transition-colors">
              <p className="font-medium">{card.person?.displayName || 'Unknown'}</p>
              <p className="text-sm text-silver">#{card.cardNumber} {card.parallel && `— ${card.parallel}`}</p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {card.rookie && <span className="badge bg-amber-500/20 text-amber-400 text-xs">RC</span>}
                {card.autograph && <span className="badge bg-purple-500/20 text-purple-400 text-xs">Auto</span>}
              </div>
              {card.estimatedValue && <p className="text-electric text-sm font-bold mt-1">${card.estimatedValue.toLocaleString()}</p>}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
