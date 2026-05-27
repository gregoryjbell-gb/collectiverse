import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import SearchBar from '@/components/SearchBar';

export const metadata = { title: 'Cards — Collectiverse' };

export default async function CardsPage({ searchParams }: { searchParams: { q?: string; sport?: string; year?: string; status?: string } }) {
  const { q, sport, year, status } = searchParams;

  const where: any = {};
  if (q) {
    where.OR = [
      { person: { displayName: { contains: q, mode: 'insensitive' } } },
      { cardNumber: { contains: q } },
      { set: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }
  if (year) where.year = parseInt(year);
  if (status) where.status = status;
  if (sport) where.set = { sport: { name: { equals: sport, mode: 'insensitive' } } };

  const cards = await prisma.card.findMany({
    where,
    include: { person: true, team: true, set: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold">Cards</h1>
          <SearchBar placeholder="Search cards..." basePath="/cards" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {['NFL', 'NBA', 'MLB'].map((s) => (
            <Link key={s} href={`/cards?sport=${s}`} className={`badge ${sport === s ? 'bg-electric text-white' : 'bg-silver/10 text-silver hover:bg-silver/20'} px-3 py-1.5`}>
              {s}
            </Link>
          ))}
          {['hold', 'sell', 'vault', 'grade'].map((st) => (
            <Link key={st} href={`/cards?status=${st}`} className={`badge ${status === st ? 'bg-electric text-white' : 'bg-silver/10 text-silver hover:bg-silver/20'} px-3 py-1.5 capitalize`}>
              {st}
            </Link>
          ))}
          {(q || sport || year || status) && (
            <Link href="/cards" className="badge bg-red-500/20 text-red-400 px-3 py-1.5">Clear</Link>
          )}
        </div>

        <p className="text-silver text-sm mb-6">{cards.length} cards found</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => (
            <Link key={card.id} href={`/cards/${card.id}`} className="card-surface p-5 hover:border-electric/30 transition-all group">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold group-hover:text-electric transition-colors">{card.person?.displayName || 'Unknown'}</p>
                  <p className="text-sm text-silver">{card.set?.name} #{card.cardNumber}</p>
                </div>
                {card.estimatedValue && <span className="text-electric font-bold text-sm">${card.estimatedValue.toLocaleString()}</span>}
              </div>
              <div className="flex gap-1.5 flex-wrap mt-2">
                {card.rookie && <span className="badge bg-amber-500/20 text-amber-400 text-xs">RC</span>}
                {card.autograph && <span className="badge bg-purple-500/20 text-purple-400 text-xs">Auto</span>}
                {card.relic && <span className="badge bg-green-500/20 text-green-400 text-xs">Relic</span>}
                {card.parallel && <span className="badge bg-electric/20 text-electric text-xs">{card.parallel}</span>}
                <span className="badge bg-silver/10 text-silver text-xs capitalize">{card.status}</span>
              </div>
              {card.year && <p className="text-xs text-silver/60 mt-2">{card.year} • {card.team?.name}</p>}
            </Link>
          ))}
        </div>

        {cards.length === 0 && (
          <div className="text-center py-20 text-silver">
            <p className="text-lg">No cards found matching your criteria.</p>
            <Link href="/cards" className="text-electric hover:underline mt-2 inline-block">View all cards</Link>
          </div>
        )}
      </div>
    </main>
  );
}
