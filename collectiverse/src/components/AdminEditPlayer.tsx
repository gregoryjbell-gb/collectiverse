'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  playerId: string;
  initialData: {
    displayName: string;
    biography?: string | null;
    achievements?: string[];
    hallOfFame?: boolean;
    aliases?: string[];
    funFacts?: string[];
    whyCollectorsCare?: string | null;
  };
}

export default function AdminEditPlayer({ playerId, initialData }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [form, setForm] = useState({
    displayName: initialData.displayName,
    biography: initialData.biography || '',
    achievements: (initialData.achievements || []).join('\n'),
    hallOfFame: initialData.hallOfFame || false,
    aliases: (initialData.aliases || []).join(', '),
    funFacts: (initialData.funFacts || []).join('\n'),
    whyCollectorsCare: initialData.whyCollectorsCare || '',
  });

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.user?.role === 'ADMIN') setIsAdmin(true);
    }).catch(() => {});
  }, []);

  if (!isAdmin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        displayName: form.displayName,
        biography: form.biography || null,
        achievements: form.achievements.split('\n').filter((a: string) => a.trim()),
        hallOfFame: form.hallOfFame,
        aliases: form.aliases.split(',').map((a: string) => a.trim()).filter(Boolean),
        funFacts: form.funFacts.split('\n').filter((f: string) => f.trim()),
        whyCollectorsCare: form.whyCollectorsCare || null,
      };

      const res = await fetch(`/api/admin/players/${playerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm mt-4">
        ✏️ Edit Player (Admin)
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface p-5 mt-4 space-y-3 border-amber-500/30 border">
      <h3 className="font-semibold text-amber-400 text-sm">Admin: Edit Player</h3>

      <div>
        <label className="text-xs text-silver block mb-1">Display Name</label>
        <input className="input-field text-sm" value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} required />
      </div>

      <div>
        <label className="text-xs text-silver block mb-1">Biography</label>
        <textarea className="input-field text-sm min-h-[100px]" value={form.biography} onChange={e => setForm({...form, biography: e.target.value})} />
      </div>

      <div>
        <label className="text-xs text-silver block mb-1">Why Collectors Care</label>
        <textarea className="input-field text-sm min-h-[80px]" value={form.whyCollectorsCare} onChange={e => setForm({...form, whyCollectorsCare: e.target.value})} placeholder="Custom text explaining why this player matters to collectors..." />
      </div>

      <div>
        <label className="text-xs text-silver block mb-1">Fun Facts (one per line)</label>
        <textarea className="input-field text-sm min-h-[80px]" value={form.funFacts} onChange={e => setForm({...form, funFacts: e.target.value})} placeholder="One fun fact per line..." />
      </div>

      <div>
        <label className="text-xs text-silver block mb-1">Achievements (one per line)</label>
        <textarea className="input-field text-sm min-h-[80px]" value={form.achievements} onChange={e => setForm({...form, achievements: e.target.value})} />
      </div>

      <div>
        <label className="text-xs text-silver block mb-1">Aliases (comma-separated)</label>
        <input className="input-field text-sm" value={form.aliases} onChange={e => setForm({...form, aliases: e.target.value})} />
      </div>

      <label className="flex items-center gap-2 text-sm text-silver cursor-pointer">
        <input type="checkbox" checked={form.hallOfFame} onChange={e => setForm({...form, hallOfFame: e.target.checked})} className="rounded" /> Hall of Fame
      </label>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm">Cancel</button>
      </div>
    </form>
  );
}
