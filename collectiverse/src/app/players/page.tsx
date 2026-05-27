import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import SearchBar from '@/components/SearchBar';

export const metadata = { title: 'Players — Collectiverse' };

export default async function PlayersPage({ searchParams }: { searchParams: { q?: string } }) {
  const { q } = searchParams;

  const where: any = {};
  if (q) where.displayName = { contains: q, mode: 'insensitive' };

  const players = await prisma.person.findMany({
    where,
    include: {
      personSports: { include: { sport: true } },
      personTeams: { include: { team: true } },
      _count: { select: { cards: true } },
    },
    orderBy: { displayName: 'asc' },
  });

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold">Players</h1>
          <SearchBar placeholder="Search players..." basePath="/players" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <Link key={player.id} href={`/players/${player.id}`} className="card-surface p-6 hover:border-electric/30 transition-colors group">
              <h2 className="text-xl font-semibold group-hover:text-electric transition-colors">{player.displayName}</h2>
              <div className="flex gap-2 mt-2 flex-wrap">
                {player.personSports.map((ps) => (
                  <span key={ps.id} className="badge bg-electric/20 text-electric">{ps.sport.name}</span>
                ))}
                {player.hallOfFame && <span className="badge bg-amber-500/20 text-amber-400">HOF</span>}
              </div>
              <div className="mt-3 text-sm text-silver">
                {player.personTeams.map((pt) => pt.team.name).join(', ')}
              </div>
              <p className="text-xs text-silver/60 mt-2">{player._count.cards} cards in database</p>
              {player.biography && <p className="text-silver text-sm mt-3 line-clamp-2">{player.biography}</p>}
            </Link>
          ))}
        </div>

        {players.length === 0 && (
          <div className="text-center py-20 text-silver">
            <p>No players found.</p>
          </div>
        )}
      </div>
    </main>
  );
}
