'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LivePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/live-events')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setEvents(d.events || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  const liveNow = events.filter(e => e.status === 'LIVE');
  const upcoming = events.filter(e => e.status === 'SCHEDULED');

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Collectiverse Live</h1>
          <Link href="/live/create" className="btn-primary text-sm">+ Create Event</Link>
        </div>

        {liveNow.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-red-400 mb-3">🔴 Live Now</h2>
            <div className="space-y-3">
              {liveNow.map((event: any) => (
                <Link key={event.id} href={`/live/${event.id}`} className="card-surface p-5 hover:border-electric/30 transition-colors block border-red-400/20 border">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">{event.title}</p>
                      <p className="text-xs text-silver">{event.seller} • {event.eventType.replace(/_/g, ' ')} • {event._count?.items || 0} items</p>
                    </div>
                    <span className="badge bg-red-400/20 text-red-400 text-xs animate-pulse">LIVE</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Upcoming</h2>
            <div className="space-y-3">
              {upcoming.map((event: any) => (
                <Link key={event.id} href={`/live/${event.id}`} className="card-surface p-4 hover:border-electric/30 transition-colors block">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-silver">{event.seller} • {event.eventType.replace(/_/g, ' ')}</p>
                      {event.scheduledStartAt && <p className="text-xs text-electric mt-1">{new Date(event.scheduledStartAt).toLocaleString()}</p>}
                    </div>
                    <span className="badge bg-blue-400/20 text-blue-400 text-xs">SCHEDULED</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {events.length === 0 && (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Live Events</h2>
            <p className="text-silver text-sm mb-4">Be the first to host a live sale, break, or showcase.</p>
            <Link href="/live/create" className="btn-primary text-sm">Create Live Event</Link>
          </div>
        )}
      </div>
    </main>
  );
}
