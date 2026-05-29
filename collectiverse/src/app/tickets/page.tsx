'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (q?: string) => {
    setLoading(true);
    fetch(`/api/tickets${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setTickets(d.tickets || []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Tickets</h1>
          <Link href="/inventory/add/select-type" className="btn-primary text-sm">+ Add to Collection</Link>
        </div>
        <form onSubmit={e => { e.preventDefault(); load(search); }} className="flex gap-3 mb-6">
          <input className="input-field flex-1" placeholder="Search by event, venue, team, performer..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn-primary text-sm">Search</button>
        </form>
        {loading ? <div className="text-silver text-center">Loading...</div> : tickets.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Tickets Yet</h2>
            <p className="text-silver text-sm mb-4">Event tickets, stubs, passes, and commemorative admissions will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t: any) => (
              <div key={t.id} className="card-surface p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{t.eventName}</p>
                    <p className="text-xs text-silver">{t.ticketType.replace(/_/g, ' ')} • {t.venue || ''}{t.eventDate ? ` • ${new Date(t.eventDate).toLocaleDateString()}` : ''}</p>
                    {(t.team || t.performer) && <p className="text-xs text-silver">{t.team}{t.opponent ? ` vs ${t.opponent}` : ''}{t.performer || ''}</p>}
                  </div>
                  <div className="flex gap-1">
                    {t.signed && <span className="badge bg-purple-400/20 text-purple-400 text-xs">Signed</span>}
                    {t.notableEvent && <span className="badge bg-amber-400/20 text-amber-400 text-xs">Notable</span>}
                    <span className="badge bg-cyan-400/20 text-cyan-400 text-xs">{t.eventType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
