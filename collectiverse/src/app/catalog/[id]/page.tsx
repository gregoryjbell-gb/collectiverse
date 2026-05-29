'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CollectibleTypeBadge } from '@/components/CollectibleTypeBadge';

export default function CatalogItemPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/catalog/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return <main className="min-h-screen py-12 px-6"><div className="text-center"><p className="text-silver text-lg">Item not found.</p><Link href="/collectibles" className="text-electric">Browse Collectibles</Link></div></main>;

  const { item, details, related } = data;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/collectibles" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Browse Catalog</Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="card-surface p-8 flex items-center justify-center min-h-[300px]">
            {item.primaryImageUrl ? (
              <img src={item.primaryImageUrl} alt={item.title} className="max-w-full rounded-lg" />
            ) : (
              <div className="text-center text-silver"><p className="text-5xl mb-3">🃏</p><p>Image not available</p></div>
            )}
          </div>

          {/* Details */}
          <div>
            <CollectibleTypeBadge type={item.collectibleType} />
            <h1 className="text-2xl font-bold mt-2">{item.title}</h1>
            {item.subtitle && <p className="text-silver mt-1">{item.subtitle}</p>}

            <div className="card-surface p-5 mt-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {item.manufacturer && <><dt className="text-silver">Manufacturer</dt><dd>{item.manufacturer}</dd></>}
                {item.year && <><dt className="text-silver">Year</dt><dd>{item.year}</dd></>}
                {item.franchise && <><dt className="text-silver">Franchise</dt><dd>{item.franchise}</dd></>}
                {details?.person && <><dt className="text-silver">Subject</dt><dd>{details.person.displayName}</dd></>}
                {details?.set && <><dt className="text-silver">Set</dt><dd>{details.set.name}</dd></>}
                {details?.team && <><dt className="text-silver">Team</dt><dd>{details.team.name}</dd></>}
                {details?.cardNumber && <><dt className="text-silver">Card #</dt><dd>{details.cardNumber}</dd></>}
                {details?.parallel && <><dt className="text-silver">Parallel</dt><dd>{details.parallel}</dd></>}
                {details?.issueNumber && <><dt className="text-silver">Issue</dt><dd>#{details.issueNumber}</dd></>}
                {details?.writer && <><dt className="text-silver">Writer</dt><dd>{details.writer}</dd></>}
                {details?.artist && <><dt className="text-silver">Artist</dt><dd>{details.artist}</dd></>}
                {details?.comicSeries && <><dt className="text-silver">Series</dt><dd>{details.comicSeries.title}</dd></>}
              </dl>
            </div>

            {/* Market range */}
            {(item.marketLow || item.marketHigh) && (
              <div className="card-surface p-4 mt-4">
                <p className="text-xs text-silver mb-1">Estimated Market Range</p>
                <p className="text-lg font-bold text-electric">${item.marketLow?.toLocaleString() || '?'} — ${item.marketHigh?.toLocaleString() || '?'}</p>
                {item.marketLastUpdatedAt && <p className="text-xs text-silver mt-1">Updated {new Date(item.marketLastUpdatedAt).toLocaleDateString()}</p>}
              </div>
            )}

            {/* Badges */}
            <div className="flex gap-2 mt-4 flex-wrap">
              {details?.rookie && <span className="badge bg-amber-400/20 text-amber-400">Rookie</span>}
              {details?.autograph && <span className="badge bg-purple-400/20 text-purple-400">Autograph</span>}
              {details?.keyIssue && <span className="badge bg-amber-400/20 text-amber-400">Key Issue</span>}
              {details?.firstAppearance && <span className="badge bg-purple-400/20 text-purple-400">1st Appearance</span>}
              {details?.variantCover && <span className="badge bg-electric/20 text-electric">Variant</span>}
            </div>

            {item.publicSummary && <p className="text-silver text-sm mt-4">{item.publicSummary}</p>}
            {item.publicImageAttribution && <p className="text-xs text-silver mt-2">Image: {item.publicImageAttribution}</p>}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold mb-4">Related Items</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r: any) => (
                <Link key={r.id} href={`/catalog/${r.slug || r.id}`} className="card-surface p-4 hover:border-electric/30 transition-colors">
                  <p className="font-medium text-sm">{r.title}</p>
                  {r.subtitle && <p className="text-xs text-silver">{r.subtitle}</p>}
                  <p className="text-xs text-silver mt-1">{r.year || ''}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
