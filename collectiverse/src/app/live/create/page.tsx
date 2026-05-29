'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const EVENT_TYPES = ['LIVE_SALE', 'BREAK', 'AUCTION', 'CLAIM_SALE', 'SHOWCASE'];

export default function CreateLiveEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', eventType: 'LIVE_SALE', scheduledStartAt: '', streamUrl: '', chatEnabled: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/live-events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { const d = await res.json(); router.push(`/live/${d.event.id}/manage`); }
    else { const d = await res.json(); alert(d.error || 'Failed'); }
    setSaving(false);
  };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-lg mx-auto">
        <Link href="/live" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back</Link>
        <h1 className="text-2xl font-bold mb-6">Create Live Event</h1>
        <form onSubmit={handleSubmit} className="card-surface p-6 space-y-4">
          <div><label className="text-sm text-silver block mb-1">Title *</label><input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
          <div><label className="text-sm text-silver block mb-1">Event Type *</label>
            <select className="input-field" value={form.eventType} onChange={e => setForm({...form, eventType: e.target.value})}>
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div><label className="text-sm text-silver block mb-1">Description</label><textarea className="input-field min-h-[80px]" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div><label className="text-sm text-silver block mb-1">Scheduled Start</label><input type="datetime-local" className="input-field" value={form.scheduledStartAt} onChange={e => setForm({...form, scheduledStartAt: e.target.value})} /></div>
          <div><label className="text-sm text-silver block mb-1">Stream URL (optional)</label><input className="input-field" placeholder="YouTube, Twitch, etc." value={form.streamUrl} onChange={e => setForm({...form, streamUrl: e.target.value})} /></div>
          <label className="flex items-center gap-2 text-sm text-silver cursor-pointer"><input type="checkbox" checked={form.chatEnabled} onChange={e => setForm({...form, chatEnabled: e.target.checked})} /> Enable chat</label>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Event'}</button>
        </form>
      </div>
    </main>
  );
}
