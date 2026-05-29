'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LiveChat from '@/components/LiveChat';

export default function LiveEventPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const load = () => {
    fetch(`/api/live-events/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleClaim = async (itemId: string) => {
    setClaiming(true);
    const res = await fetch(`/api/live-events/${id}/items/${itemId}/claim`, { method: 'POST' });
    if (res.ok) { alert('Claim submitted! Waiting for seller to accept.'); load(); }
    else { const d = await res.json(); alert(d.error || 'Claim failed'); }
    setClaiming(false);
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return <main className="min-h-screen py-12 px-6"><div className="text-center"><p className="text-silver">Event not found.</p><Link href="/live" className="text-electric">Back to Live</Link></div></main>;

  const { event, seller } = data;
  const currentItem = event.items?.find((i: any) => i.status === 'PRESENTING');
  const queue = event.items?.filter((i: any) => i.status === 'QUEUED') || [];

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/live" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; All Events</Link>

        <div className="card-surface p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{event.title}</h1>
              <p className="text-silver text-sm">{seller} • {event.eventType.replace(/_/g, ' ')}</p>
              {event.description && <p className="text-silver text-sm mt-2">{event.description}</p>}
            </div>
            <span className={`badge text-xs ${event.status === 'LIVE' ? 'bg-red-400/20 text-red-400 animate-pulse' : event.status === 'SCHEDULED' ? 'bg-blue-400/20 text-blue-400' : 'bg-silver/20 text-silver'}`}>{event.status}</span>
          </div>
        </div>

        {/* Current Item */}
        {currentItem && (
          <div className="card-surface p-6 mb-6 border-electric/30 border">
            <p className="text-xs text-electric uppercase tracking-wider mb-2">Now Presenting</p>
            <h2 className="text-xl font-bold mb-1">{currentItem.title}</h2>
            {currentItem.description && <p className="text-silver text-sm mb-3">{currentItem.description}</p>}
            <div className="flex justify-between items-center">
              <p className="text-2xl font-bold text-electric">{currentItem.claimPrice ? `$${currentItem.claimPrice}` : 'Price TBD'}</p>
              {event.status === 'LIVE' && currentItem.status === 'PRESENTING' && (
                <button onClick={() => handleClaim(currentItem.id)} disabled={claiming} className="btn-primary">{claiming ? 'Claiming...' : 'Claim This Item'}</button>
              )}
            </div>
          </div>
        )}

        {/* Queue */}
        {queue.length > 0 && (
          <div className="card-surface p-5">
            <h3 className="font-semibold text-sm mb-3">Up Next ({queue.length})</h3>
            <div className="space-y-2">
              {queue.map((item: any, i: number) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-silver w-6">{i + 1}</span>
                    <p className="text-sm">{item.title}</p>
                  </div>
                  {item.claimPrice && <span className="text-sm text-electric">${item.claimPrice}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Chat */}
        {event.chatEnabled && (
          <div className="mt-6">
            <LiveChat eventId={id as string} isLive={event.status === 'LIVE'} />
          </div>
        )}
      </div>
    </main>
  );
}
