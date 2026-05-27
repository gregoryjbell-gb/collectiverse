import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function HomePage() {
  const featuredCards = await prisma.card.findMany({
    where: { estimatedValue: { gt: 50 } },
    include: { person: true, team: true, set: true },
    orderBy: { estimatedValue: 'desc' },
    take: 6,
  });

  const featuredPlayers = await prisma.person.findMany({
    include: { personSports: { include: { sport: true } } },
    take: 5,
  });

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6 lg:py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-gunmetal/30 to-navy" />
        <div className="relative max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Transforming Trading Cards Into{' '}
            <span className="text-electric">Interactive Collectibles</span>
          </h1>
          <p className="text-xl md:text-2xl text-silver max-w-3xl mx-auto mb-10">
            Every Card Has a Story.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cards" className="btn-primary text-lg px-8 py-3">
              Explore Cards
            </Link>
            <Link href="/players" className="btn-secondary text-lg px-8 py-3">
              View Players
            </Link>
          </div>
        </div>
      </section>

      {/* QR Demo Section */}
      <section className="py-20 px-6 bg-gunmetal/20">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">QR-Linked Card Identity</h2>
          <p className="text-silver text-lg mb-8 max-w-2xl mx-auto">
            Every physical card connects to a dynamic digital profile. Scan a QR code to instantly access card intelligence, grading data, and collector insights.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Scan', desc: 'Point your camera at any Collectiverse QR code' },
              { title: 'Discover', desc: 'Instant access to card data, history, and analytics' },
              { title: 'Collect', desc: 'Track, grade, and manage your portfolio' },
            ].map((step) => (
              <div key={step.title} className="card-surface p-6">
                <h3 className="text-xl font-semibold text-electric mb-2">{step.title}</h3>
                <p className="text-silver">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cards */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Featured Cards</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCards.map((card) => (
              <Link key={card.id} href={`/cards/${card.id}`} className="card-surface p-5 hover:border-electric/30 transition-colors group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold group-hover:text-electric transition-colors">{card.person?.displayName}</p>
                    <p className="text-sm text-silver">{card.set?.name} #{card.cardNumber}</p>
                  </div>
                  {card.estimatedValue && (
                    <span className="text-electric font-bold">${card.estimatedValue.toLocaleString()}</span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {card.rookie && <span className="badge bg-amber-500/20 text-amber-400">Rookie</span>}
                  {card.autograph && <span className="badge bg-purple-500/20 text-purple-400">Auto</span>}
                  {card.parallel && <span className="badge bg-electric/20 text-electric">{card.parallel}</span>}
                  <span className="badge bg-silver/10 text-silver">{card.team?.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Players */}
      <section className="py-20 px-6 bg-gunmetal/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Featured Players</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPlayers.map((player) => (
              <Link key={player.id} href={`/players/${player.id}`} className="card-surface p-5 hover:border-electric/30 transition-colors group">
                <p className="font-semibold text-lg group-hover:text-electric transition-colors">{player.displayName}</p>
                <div className="flex gap-2 mt-2">
                  {player.personSports.map((ps) => (
                    <span key={ps.id} className="badge bg-electric/20 text-electric">{ps.sport.name}</span>
                  ))}
                  {player.hallOfFame && <span className="badge bg-amber-500/20 text-amber-400">HOF</span>}
                </div>
                {player.biography && (
                  <p className="text-silver text-sm mt-3 line-clamp-2">{player.biography}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Explanation */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">The Collectible Intelligence Platform</h2>
          <p className="text-silver text-lg mb-12 max-w-3xl mx-auto">
            Collectiverse connects physical trading cards to dynamic digital profiles with analytics, AI grading infrastructure, and collector tools.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              { title: 'Inventory', desc: 'Track every card with status, location, and value' },
              { title: 'Analytics', desc: 'Portfolio valuation and market intelligence' },
              { title: 'QR Identity', desc: 'Physical-to-digital card profiles via QR codes' },
              { title: 'AI Ready', desc: 'Architecture for grading, OCR, and recommendations' },
            ].map((f) => (
              <div key={f.title} className="card-surface p-5">
                <h3 className="font-semibold text-electric mb-1">{f.title}</h3>
                <p className="text-silver text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-electric/10 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Start Building Your Digital Collection</h2>
          <p className="text-silver mb-8">Every card has a story. Let Collectiverse tell it.</p>
          <Link href="/cards" className="btn-primary text-lg px-8 py-3">
            Browse the Vault
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-silver/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-silver text-sm">© 2024 Collectiverse. AI-Powered Collectible Intelligence.</p>
          <nav className="flex gap-6 text-sm text-silver">
            <Link href="/cards" className="hover:text-white transition-colors">Cards</Link>
            <Link href="/players" className="hover:text-white transition-colors">Players</Link>
            <Link href="/sets" className="hover:text-white transition-colors">Sets</Link>
            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
