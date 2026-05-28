import { notFound } from 'next/navigation';

interface Props { params: { publicId: string } }

async function getPassport(publicId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/passport/group/${publicId}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function GroupPassportPage({ params }: Props) {
  const data = await getPassport(params.publicId);
  if (!data) notFound();

  const { passport } = data;

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="card-surface max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-electric/20 to-transparent p-6 text-center">
          <p className="text-xs text-silver uppercase tracking-wider mb-1">Collectiverse Verified</p>
          <h1 className="text-xl font-bold">{passport.name}</h1>
          <p className="text-silver text-sm">{passport.groupType.replace(/_/g, ' ')}</p>
        </div>

        <div className="px-6 pb-6 pt-4">
          <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
            {passport.cardSet && <><dt className="text-silver">Card Set</dt><dd>{passport.cardSet.name} ({passport.cardSet.year})</dd></>}
            {passport.cardSet?.manufacturer && <><dt className="text-silver">Manufacturer</dt><dd>{passport.cardSet.manufacturer}</dd></>}
            <dt className="text-silver">Items</dt><dd>{passport.itemCount}</dd>
            <dt className="text-silver">Quantity</dt><dd>{passport.quantity}</dd>
          </dl>

          <div className="flex gap-2 mb-4">
            {passport.sealed && <span className="badge bg-amber-500/20 text-amber-400">🔒 Sealed</span>}
            <span className="badge bg-electric/20 text-electric">{passport.groupType.replace(/_/g, ' ')}</span>
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
