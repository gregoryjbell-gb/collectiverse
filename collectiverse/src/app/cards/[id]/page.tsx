import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import AddToInventoryButton from '@/components/AddToInventoryButton';
import AdminEditCard from '@/components/AdminEditCard';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await prisma.card.findUnique({
    where: { id: params.id },
    include: { person: true, set: true },
  });
  if (!card) return { title: 'Card Not Found' };
  const title = `${card.person?.displayName || 'Card'} — ${card.set?.name} #${card.cardNumber}`;
  return {
    title: `${title} — Collectiverse`,
    description: card.whyItMatters || `${title} on Collectiverse`,
    openGraph: { title, description: card.whyItMatters || title, type: 'article' },
    twitter: { card: 'summary_large_image', title },
  };
}

export default async function CardPage({ params }: Props) {
  const card = await prisma.card.findUnique({
    where: { id: params.id },
    include: {
      person: { include: { personTeams: { include: { team: true } }, personSports: { include: { sport: true } } } },
      team: true,
      set: { include: { sport: true } },
      grades: true,
      media: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!card) notFound();

  // Log QR scan
  await prisma.qrScan.create({ data: { cardId: card.id } });

  const relatedCards = await prisma.card.findMany({
    where: { personId: card.personId, id: { not: card.id } },
    include: { set: true, team: true },
    take: 4,
  });

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/cards" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back to Cards</Link>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left: Images */}
          <div>
            <div className="card-surface p-8 flex items-center justify-center min-h-[300px]">
              {card.frontImageUrl ? (
                <img src={card.frontImageUrl} alt={`${card.person?.displayName} card front`} className="max-w-full rounded-lg" />
              ) : (
                <div className="text-center text-silver">
                  <p className="text-6xl mb-4">🃏</p>
                  <p>Card Image Coming Soon</p>
                </div>
              )}
            </div>
            {card.backImageUrl && (
              <div className="card-surface p-8 mt-4 flex items-center justify-center">
                <img src={card.backImageUrl} alt="Card back" className="max-w-full rounded-lg" />
              </div>
            )}
            <QRCodeDisplay cardId={card.id} />
            <div className="mt-4">
              <AddToInventoryButton cardId={card.id} />
            </div>
            <AdminEditCard cardId={card.id} initialData={{
              cardNumber: card.cardNumber,
              year: card.year,
              parallel: card.parallel,
              rookie: card.rookie,
              autograph: card.autograph,
              relic: card.relic,
              serialNumber: card.serialNumber,
              printRun: card.printRun,
              estimatedValue: card.estimatedValue,
              gradingRecommendation: card.gradingRecommendation,
              status: card.status,
              whyItMatters: card.whyItMatters,
              funFacts: card.funFacts,
            }} />
          </div>

          {/* Right: Details */}
          <div>
            <h1 className="text-3xl font-bold mb-1">{card.person?.displayName || card.characterName || card.subjectName || 'Unknown'}</h1>
            <p className="text-silver text-lg mb-6">{card.set?.name} #{card.cardNumber} {card.parallel && `— ${card.parallel}`}</p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {card.rookie && <span className="badge bg-amber-500/20 text-amber-400">Rookie Card</span>}
              {card.autograph && <span className="badge bg-purple-500/20 text-purple-400">Autograph</span>}
              {card.relic && <span className="badge bg-green-500/20 text-green-400">Game-Used Relic</span>}
              {card.serialNumber && <span className="badge bg-electric/20 text-electric">#{card.serialNumber}</span>}
              <span className="badge bg-silver/10 text-silver capitalize">{card.status}</span>
            </div>

            {/* Value */}
            {card.estimatedValue && (
              <div className="card-surface p-4 mb-6">
                <p className="text-sm text-silver">Estimated Value</p>
                <p className="text-3xl font-bold text-electric">${card.estimatedValue.toLocaleString()}</p>
              </div>
            )}

            {/* Card Metadata */}
            <div className="card-surface p-5 mb-6">
              <h3 className="font-semibold mb-3">Card Details</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {card.year && <><dt className="text-silver">Year</dt><dd>{card.year}</dd></>}
                {card.team && <><dt className="text-silver">Team</dt><dd>{card.team.name}</dd></>}
                {card.set && <><dt className="text-silver">Set</dt><dd>{card.set.name}</dd></>}
                {card.cardNumber && <><dt className="text-silver">Card #</dt><dd>{card.cardNumber}</dd></>}
                {card.parallel && <><dt className="text-silver">Parallel</dt><dd>{card.parallel}</dd></>}
                {card.printRun && <><dt className="text-silver">Print Run</dt><dd>{card.printRun}</dd></>}
                {card.set?.sport && <><dt className="text-silver">Sport</dt><dd>{card.set.sport.name}</dd></>}
                {card.cardCategory !== 'SPORTS' && <><dt className="text-silver">Category</dt><dd className="capitalize">{card.cardCategory.replace(/_/g, ' ').toLowerCase()}</dd></>}
                {card.franchise && <><dt className="text-silver">Franchise</dt><dd>{card.franchise}</dd></>}
                {card.universe && <><dt className="text-silver">Universe</dt><dd>{card.universe}</dd></>}
                {card.characterName && <><dt className="text-silver">Character</dt><dd>{card.characterName}</dd></>}
                {card.actorName && <><dt className="text-silver">Actor</dt><dd>{card.actorName}</dd></>}
                {card.artistName && <><dt className="text-silver">Artist</dt><dd>{card.artistName}</dd></>}
                {card.genre && <><dt className="text-silver">Genre</dt><dd>{card.genre}</dd></>}
                {card.gradingRecommendation && <><dt className="text-silver">Grade Rec.</dt><dd>{card.gradingRecommendation}</dd></>}
              </dl>
            </div>

            {/* Why It Matters */}
            {card.whyItMatters && (
              <div className="card-surface p-5 mb-6">
                <h3 className="font-semibold mb-2">Why This Card Matters</h3>
                <p className="text-silver">{card.whyItMatters}</p>
              </div>
            )}

            {/* Fun Facts */}
            {card.funFacts.length > 0 && (
              <div className="card-surface p-5 mb-6">
                <h3 className="font-semibold mb-2">Fun Facts</h3>
                <ul className="list-disc list-inside text-silver space-y-1">
                  {card.funFacts.map((fact, i) => <li key={i}>{fact}</li>)}
                </ul>
              </div>
            )}

            {/* Subject Info */}
            {card.person && (
              <div className="card-surface p-5 mb-6">
                <h3 className="font-semibold mb-2">About {card.person.displayName}</h3>
                {card.person.biography && <p className="text-silver text-sm mb-3">{card.person.biography}</p>}
                {card.person.personTeams.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {card.person.personTeams.map((pt) => (
                      <span key={pt.id} className="badge bg-silver/10 text-silver">
                        {pt.team.name} ({pt.startYear}–{pt.endYear || 'present'})
                      </span>
                    ))}
                  </div>
                )}
                <Link href={`/players/${card.person.id}`} className="text-electric text-sm hover:underline mt-3 inline-block">
                  View full player profile &rarr;
                </Link>
              </div>
            )}

            {/* Grades */}
            {card.grades.length > 0 && (
              <div className="card-surface p-5 mb-6">
                <h3 className="font-semibold mb-2">Grading</h3>
                {card.grades.map((g) => (
                  <div key={g.id} className="flex justify-between items-center py-1 border-b border-silver/10 last:border-0">
                    <span className="text-silver">{g.gradingCompany}</span>
                    <span className="font-bold text-electric">{g.grade}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Media */}
            {card.media.length > 0 && (
              <div className="card-surface p-5 mb-6">
                <h3 className="font-semibold mb-3">Media</h3>
                <div className="space-y-3">
                  {card.media.map((m) => (
                    <div key={m.id}>
                      {m.type === 'youtube' && (
                        <iframe src={m.url} className="w-full aspect-video rounded-lg" allowFullScreen title={m.caption || 'Video'} />
                      )}
                      {m.type === 'image' && <img src={m.url} alt={m.caption || ''} className="w-full rounded-lg" />}
                      {m.caption && <p className="text-silver text-xs mt-1">{m.caption}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Cards */}
        {relatedCards.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Cards</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedCards.map((rc) => (
                <Link key={rc.id} href={`/cards/${rc.id}`} className="card-surface p-4 hover:border-electric/30 transition-colors">
                  <p className="font-medium">{rc.set?.name} #{rc.cardNumber}</p>
                  <p className="text-sm text-silver">{rc.year} • {rc.team?.name}</p>
                  {rc.estimatedValue && <p className="text-electric text-sm font-bold mt-1">${rc.estimatedValue.toLocaleString()}</p>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
