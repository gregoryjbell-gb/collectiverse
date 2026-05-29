'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Tab = 'live' | 'upcoming' | 'breaks' | 'auctions' | 'claims';

export default function LivePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('live');

  useEffect(() => {
    setLoading(true);
    let url = '/api/live-events';
    if (tab === 'upcoming') url = '/api/live-events/upcoming';
    else if (tab === 'breaks') url = '/api/live-events?eventType=BREAK';
    else if (tab === 'auctions') url = '/api/live-events?eventType=AUCTION';
    else if (tab === 'claims') url = '/api/live-events?eventType=CLAIM_SALE';
    else url = '/api/live-events?status=LIVE';

    fetch(url)
      .then(r => r.ok ? r.json() : { events: [] })
      .then(d => setEvents(d.events || []))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Collectiverse Live</h1>
          <Link href="/live/create" className="btn-primary text-sm">+ Create Event</Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {([['live', '🔴 Live Now'], ['upcoming', '📅 Upcoming'], ['breaks', '📦 Breaks'], ['auctions', '🔨 Auctions'], ['claims', '🏷️ Claims']] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${tab === key ? 'bg-electric text-white' : 'bg-gunmetal/50 text-silver hover:text-white'}`}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-silver text-center">Loading...</div>
        ) : events.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">{tab === 'live' ? 'No Live Events Right Now' : 'No Events Found'}</h2>
            <p className="text-silver text-sm mb-4">{tab === 'upcoming' ? 'Check back soon for scheduled events.' : 'Be the first to host a live event.'}</p>
            <Link href="/live/create" className="btn-primary text-sm">Create Live Event</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event: any) => (
              <Link key={event.id} href={`/live/${event.id}`} className={`card-surface p-5 hover:border-electric/30 transition-colors block ${event.featured ? 'border-electric/20 border' : ''} ${event.status === 'LIVE' ? 'border-red-400/20 border' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {event.featured && <span className="text-xs text-electric">⭐ Featured</span>}
                      <p className="font-bold">{event.title}</p>
                    </div>
                    <p className="text-xs text-silver">{event.seller} • {event.eventType.replace(/_/g, ' ')}{event.category ? ` • ${event.category.replace(/_/g, ' ')}` : ''}</p>
                    {event.scheduledStartAt && <p className="text-xs text-electric mt-1">{new Date(event.scheduledStartAt).toLocaleString()}</p>}
                    {event.reminderCount > 0 && <p className="text-xs text-silver mt-0.5">🔔 {event.reminderCount} reminders</p>}
                  </div>
                  <span className={`badge text-xs ${event.status === 'LIVE' ? 'bg-red-400/20 text-red-400 animate-pulse' : event.status === 'SCHEDULED' ? 'bg-blue-400/20 text-blue-400' : 'bg-silver/20 text-silver'}`}>{event.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
