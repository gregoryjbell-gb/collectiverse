'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function CollectibleDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/collectibles/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return <main className="min-h-screen py-12 px-6"><div className="text-center"><p className="text-silver">Collectible not found.</p><Link href="/collectibles" className="text-electric">Browse Collectibles</Link></div></main>;

  const { collectible, details } = data;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/collectibles" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; All Collectibles</Link>

        <div className="card-surface p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold">{collectible.title}</h1>
              <p className="text-silver">{collectible.manufacturer}{collectible.year ? ` • ${collectible.year}` : ''}</p>
            </div>
            <span className="badge bg-electric/20 text-electric text-xs">{collectible.collectibleType.replace(/_/g, ' ')}</span>
          </div>

          {collectible.franchise && <p className="text-sm text-silver mb-4">Franchise: {collectible.franchise}</p>}

          {/* Type-specific details */}
          {collectible.cardId && details && (
            <div className="border-t border-silver/10 pt-4 mt-4">
              <h3 className="font-semibold text-sm mb-2">Card Details</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {details.person && <><dt className="text-silver">Subject</dt><dd>{details.person.displayName}</dd></>}
                {details.set && <><dt className="text-silver">Set</dt><dd>{details.set.name} ({details.set.year})</dd></>}
                {details.team && <><dt className="text-silver">Team</dt><dd>{details.team.name}</dd></>}
                {details.cardNumber && <><dt className="text-silver">Card #</dt><dd>{details.cardNumber}</dd></>}
                {details.parallel && <><dt className="text-silver">Parallel</dt><dd>{details.parallel}</dd></>}
              </dl>
              <Link href={`/cards/${collectible.cardId}`} className="text-electric text-sm mt-3 inline-block">View full card page →</Link>
            </div>
          )}

          {collectible.comicIssueId && details && (
            <div className="border-t border-silver/10 pt-4 mt-4">
              <h3 className="font-semibold text-sm mb-2">Comic Details</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {details.comicSeries && <><dt className="text-silver">Series</dt><dd>{details.comicSeries.title}</dd></>}
                <dt className="text-silver">Issue</dt><dd>#{details.issueNumber}</dd>
                {details.writer && <><dt className="text-silver">Writer</dt><dd>{details.writer}</dd></>}
                {details.artist && <><dt className="text-silver">Artist</dt><dd>{details.artist}</dd></>}
                {details.coverDate && <><dt className="text-silver">Cover Date</dt><dd>{details.coverDate}</dd></>}
              </dl>
              <div className="flex gap-2 mt-3">
                {details.keyIssue && <span className="badge bg-amber-400/20 text-amber-400 text-xs">Key Issue</span>}
                {details.firstAppearance && <span className="badge bg-purple-400/20 text-purple-400 text-xs">1st Appearance</span>}
                {details.variantCover && <span className="badge bg-electric/20 text-electric text-xs">Variant</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
