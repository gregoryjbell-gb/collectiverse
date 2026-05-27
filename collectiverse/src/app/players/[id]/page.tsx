import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import AdminEditPlayer from '@/components/AdminEditPlayer';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const person = await prisma.person.findUnique({ where: { id: params.id } });
  if (!person) return { title: 'Player Not Found' };
  return {
    title: `${person.displayName} — Collectiverse`,
    description: person.biography || `${person.displayName} player profile on Collectiverse`,
    openGraph: { title: person.displayName, description: person.biography || '', type: 'profile' },
  };
}

export default async function PlayerPage({ params }: Props) {
  const person = await prisma.person.findUnique({
    where: { id: params.id },
    include: {
      personTeams: { include: { team: { include: { sport: true } } }, orderBy: { startYear: 'asc' } },
      personSports: { include: { sport: true } },
      cards: { include: { set: true, team: true }, orderBy: { year: 'asc' } },
    },
  });

  if (!person) notFound();

  const totalValue = person.cards.reduce((sum: number, c: any) => sum + (c.estimatedValue || 0), 0);

  // Get teams and sports for the edit component
  const allTeams = await prisma.team.findMany({ include: { sport: true }, orderBy: { name: 'asc' } });
  const allSports = await prisma.sport.findMany({ orderBy: { name: 'asc' } });

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/players" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back to Players</Link>

        {/* Hero */}
        <div className="card-surface p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-full bg-electric/20 flex items-center justify-center text-3xl font-bold text-electric shrink-0">
              {person.displayName.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">{person.displayName}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                {person.personSports.map((ps: any) => (
                  <span key={ps.id} className="badge bg-electric/20 text-electric">{ps.sport.name}</span>
                ))}
                {person.hallOfFame && <span className="badge bg-amber-500/20 text-amber-400">Hall of Fame</span>}
              </div>
              {person.biography && <p className="text-silver">{person.biography}</p>}
            </div>
          </div>
          <AdminEditPlayer
            playerId={person.id}
            initialData={{
              displayName: person.displayName,
              biography: person.biography,
              achievements: person.achievements,
              hallOfFame: person.hallOfFame,
              aliases: person.aliases,
              funFacts: person.funFacts,
              whyCollectorsCare: person.whyCollectorsCare,
              personTeams: person.personTeams.map((pt: any) => ({
                id: pt.id,
                teamId: pt.teamId,
                teamName: pt.team.name,
                sportName: pt.team.sport.name,
                startYear: pt.startYear,
                endYear: pt.endYear,
              })),
            }}
            allTeams={allTeams.map((t: any) => ({ id: t.id, name: t.name, sportName: t.sport.name }))}
            allSports={allSports.map((s: any) => ({ id: s.id, name: s.name }))}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Fun Facts */}
            {person.funFacts.length > 0 && (
              <div className="card-surface p-6">
                <h2 className="text-xl font-semibold mb-4">Fun Facts</h2>
                <ul className="space-y-2">
                  {person.funFacts.map((fact: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-electric mt-0.5">•</span>
                      <span className="text-silver">{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Teams Timeline */}
            <div className="card-surface p-6">
              <h2 className="text-xl font-semibold mb-4">Career Timeline</h2>
              <div className="space-y-3">
                {person.personTeams.map((pt: any) => (
                  <div key={pt.id} className="flex items-center gap-4 py-2 border-b border-silver/10 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-electric" />
                    <div>
                      <p className="font-medium">{pt.team.name}</p>
                      <p className="text-sm text-silver">{pt.startYear}–{pt.endYear || 'present'} • {pt.team.sport.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            {person.achievements.length > 0 && (
              <div className="card-surface p-6">
                <h2 className="text-xl font-semibold mb-4">Achievements</h2>
                <div className="flex flex-wrap gap-2">
                  {person.achievements.map((a: string, i: number) => (
                    <span key={i} className="badge bg-amber-500/10 text-amber-300 px-3 py-1">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Why Collectors Care */}
            <div className="card-surface p-6">
              <h2 className="text-xl font-semibold mb-3">Why Collectors Care</h2>
              <p className="text-silver">
                {person.whyCollectorsCare
                  ? person.whyCollectorsCare
                  : person.hallOfFame
                    ? `${person.displayName} is a Hall of Famer whose cards carry lasting legacy value. Key rookies and autos are cornerstone pieces for serious collectors.`
                    : `${person.displayName} is an active player whose card values are tied to on-field performance. Early cards and limited parallels offer upside potential.`
                }
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card-surface p-5">
              <h3 className="font-semibold mb-3">Collection Stats</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-silver">Cards in DB</dt><dd className="font-bold">{person.cards.length}</dd></div>
                <div className="flex justify-between"><dt className="text-silver">Total Value</dt><dd className="font-bold text-electric">${totalValue.toLocaleString()}</dd></div>
              </dl>
            </div>

            <div className="card-surface p-5">
              <h3 className="font-semibold mb-3">Sports</h3>
              <div className="flex flex-wrap gap-2">
                {person.personSports.map((ps: any) => (
                  <span key={ps.id} className="badge bg-electric/20 text-electric">{ps.sport.name} ({ps.sport.league})</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cards */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold mb-6">Cards ({person.cards.length})</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {person.cards.map((card: any) => (
              <Link key={card.id} href={`/cards/${card.id}`} className="card-surface p-4 hover:border-electric/30 transition-colors">
                <p className="font-medium">{card.set?.name} #{card.cardNumber}</p>
                <p className="text-sm text-silver">{card.year} • {card.team?.name}</p>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {card.rookie && <span className="badge bg-amber-500/20 text-amber-400 text-xs">RC</span>}
                  {card.autograph && <span className="badge bg-purple-500/20 text-purple-400 text-xs">Auto</span>}
                  {card.parallel && <span className="badge bg-electric/20 text-electric text-xs">{card.parallel}</span>}
                </div>
                {card.estimatedValue && <p className="text-electric text-sm font-bold mt-2">${card.estimatedValue.toLocaleString()}</p>}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
