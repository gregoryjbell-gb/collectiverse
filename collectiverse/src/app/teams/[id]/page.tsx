import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

interface Props { params: { id: string } }

export default async function TeamPage({ params }: Props) {
  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      sport: true,
      personTeams: { include: { person: true } },
      cards: { include: { person: true, set: true }, take: 20, orderBy: { estimatedValue: 'desc' } },
    },
  });

  if (!team) notFound();

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Home</Link>
        <div className="card-surface p-8 mb-8">
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-silver">{team.city} • {team.sport.name}</p>
        </div>

        {team.personTeams.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Players</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.personTeams.map((pt) => (
                <Link key={pt.id} href={`/players/${pt.person.id}`} className="card-surface p-4 hover:border-electric/30 transition-colors">
                  <p className="font-medium">{pt.person.displayName}</p>
                  <p className="text-sm text-silver">{pt.startYear}–{pt.endYear || 'present'}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-2xl font-bold mb-4">Cards ({team.cards.length})</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.cards.map((card) => (
              <Link key={card.id} href={`/cards/${card.id}`} className="card-surface p-4 hover:border-electric/30 transition-colors">
                <p className="font-medium">{card.person?.displayName}</p>
                <p className="text-sm text-silver">{card.set?.name} #{card.cardNumber}</p>
                {card.estimatedValue && <p className="text-electric text-sm font-bold mt-1">${card.estimatedValue.toLocaleString()}</p>}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
