import { notFound } from 'next/navigation';

interface Props { params: { publicId: string } }

async function getPassport(publicId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/passport/item/${publicId}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function ItemPassportPage({ params }: Props) {
  const data = await getPassport(params.publicId);
  if (!data) notFound();

  const { passport } = data;
  const card = passport.card;

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="card-surface max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-electric/20 to-transparent p-6 text-center">
          <p className="text-xs text-silver uppercase tracking-wider mb-1">Collectiverse Verified</p>
          <h1 className="text-xl font-bold">{card.playerName || 'Collectible'}</h1>
          <p className="text-silver text-sm">{card.setName} #{card.cardNumber}</p>
        </div>

        {card.frontImageUrl && (
          <div className="px-6 py-4 flex justify-center">
            <img src={card.frontImageUrl} alt="Card" className="max-h-48 rounded-lg" />
          </div>
        )}

        <div className="px-6 pb-6">
          <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
            {card.year && <><dt className="text-silver">Year</dt><dd>{card.year}</dd></>}
            {card.manufacturer && <><dt className="text-silver">Manufacturer</dt><dd>{card.manufacturer}</dd></>}
            {card.teamName && <><dt className="text-silver">Team</dt><dd>{card.teamName}</dd></>}
            {card.cardNumber && <><dt className="text-silver">Card #</dt><dd>{card.cardNumber}</dd></>}
            {passport.condition && <><dt className="text-silver">Condition</dt><dd>{passport.gradeCompany ? `${passport.gradeCompany} ${passport.gradeValue}` : passport.condition}</dd></>}
            {passport.certNumber && <><dt className="text-silver">Cert #</dt><dd>{passport.certNumber}</dd></>}
          </dl>

          <div className="flex gap-2 flex-wrap mb-4">
            {card.rookie && <span className="badge bg-amber-500/20 text-amber-400">Rookie</span>}
            {card.autograph && <span className="badge bg-purple-500/20 text-purple-400">Autograph</span>}
            {card.parallel && <span className="badge bg-electric/20 text-electric">{card.parallel}</span>}
          </div>

          {passport.status === 'FOR_SALE' && passport.askingPrice && (
            <div className="card-surface p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center mb-4">
              <p className="text-green-400 font-bold text-lg">${passport.askingPrice}</p>
              <p className="text-xs text-silver">Listed for Sale</p>
            </div>
          )}

          <div className="text-center pt-4 border-t border-silver/10">
            <p className="text-xs text-silver">✓ Verified on Collectiverse</p>
          </div>
        </div>
      </div>
    </main>
  );
}
