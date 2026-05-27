'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ACHIEVEMENT_OPTIONS = [
  'Pro Football Hall of Fame', 'Basketball Hall of Fame', 'Baseball Hall of Fame',
  'NFL MVP', 'NBA MVP', 'MLB MVP', 'Super Bowl MVP', 'Finals MVP', 'World Series MVP',
  'Heisman Trophy', 'Rookie of the Year', 'Defensive Player of the Year',
  'Pro Bowl', '2x Pro Bowl', '3x Pro Bowl', '4x Pro Bowl', '5x Pro Bowl',
  'All-Star', '2x All-Star', '3x All-Star', '5x All-Star', '10x All-Star', '14x All-Star',
  'All-Pro', '1st Team All-Pro', '2nd Team All-Pro',
  'NBA Champion', '2x NBA Champion', '3x NBA Champion', '6x NBA Champion',
  'Super Bowl Champion', '2x Super Bowl Champion',
  'World Series Champion', '2x World Series Champion',
  'Scoring Champion', 'Batting Champion', 'Passing Leader', 'Rushing Leader',
  'Gold Glove', 'Silver Slugger', 'Cy Young Award',
  '4x Super Bowl Appearances', 'Olympic Gold Medal',
  'Bo Knows Campaign', 'Cultural Icon',
  'Bills All-Time Passing Leader', 'Bills Single-Season TD Record',
  'Pro Bowl MVP 2022',
];

interface TeamEntry {
  id?: string;
  teamId: string;
  teamName: string;
  sportName: string;
  startYear: number | null;
  endYear: number | null;
}

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
    personTeams?: TeamEntry[];
  };
  allTeams: Array<{ id: string; name: string; sportName: string }>;
  allSports: Array<{ id: string; name: string }>;
}

export default function AdminEditPlayer({ playerId, initialData, allTeams, allSports }: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [form, setForm] = useState({
    displayName: initialData.displayName,
    biography: initialData.biography || '',
    achievements: initialData.achievements || [],
    hallOfFame: initialData.hallOfFame || false,
    aliases: (initialData.aliases || []).join(', '),
    funFacts: initialData.funFacts || [] as string[],
    whyCollectorsCare: initialData.whyCollectorsCare || '',
  });

  const [teamEntries, setTeamEntries] = useState<TeamEntry[]>(initialData.personTeams || []);
  const [newFact, setNewFact] = useState('');
  const [newAchievement, setNewAchievement] = useState('');
  const [customAchievement, setCustomAchievement] = useState('');

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.user?.role === 'ADMIN') setIsAdmin(true);
    }).catch(() => {});
  }, []);

  if (!isAdmin) return null;

  const addFact = () => {
    if (newFact.trim()) {
      setForm({ ...form, funFacts: [...form.funFacts, newFact.trim()] });
      setNewFact('');
    }
  };

  const removeFact = (i: number) => {
    setForm({ ...form, funFacts: form.funFacts.filter((_, idx) => idx !== i) });
  };

  const addAchievement = () => {
    const val = newAchievement || customAchievement;
    if (val.trim() && !form.achievements.includes(val.trim())) {
      setForm({ ...form, achievements: [...form.achievements, val.trim()] });
      setNewAchievement('');
      setCustomAchievement('');
    }
  };

  const removeAchievement = (i: number) => {
    setForm({ ...form, achievements: form.achievements.filter((_, idx) => idx !== i) });
  };

  const addTeamEntry = () => {
    setTeamEntries([...teamEntries, { teamId: '', teamName: '', sportName: '', startYear: null, endYear: null }]);
  };

  const updateTeamEntry = (i: number, field: string, value: any) => {
    const updated = [...teamEntries];
    (updated[i] as any)[field] = value;
    if (field === 'teamId') {
      const team = allTeams.find(t => t.id === value);
      if (team) {
        updated[i].teamName = team.name;
        updated[i].sportName = team.sportName;
      }
    }
    setTeamEntries(updated);
  };

  const removeTeamEntry = (i: number) => {
    setTeamEntries(teamEntries.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        displayName: form.displayName,
        biography: form.biography || null,
        achievements: form.achievements,
        hallOfFame: form.hallOfFame,
        aliases: form.aliases.split(',').map((a: string) => a.trim()).filter(Boolean),
        funFacts: form.funFacts,
        whyCollectorsCare: form.whyCollectorsCare || null,
        personTeams: teamEntries.filter(t => t.teamId).map(t => ({
          id: t.id,
          teamId: t.teamId,
          startYear: t.startYear,
          endYear: t.endYear,
        })),
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
    <form onSubmit={handleSubmit} className="card-surface p-5 mt-4 space-y-4 border-amber-500/30 border">
      <h3 className="font-semibold text-amber-400 text-sm">Admin: Edit Player</h3>

      {/* Basic Info */}
      <div>
        <label className="text-xs text-silver block mb-1">Display Name *</label>
        <input className="input-field text-sm" value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} required />
      </div>

      <div>
        <label className="text-xs text-silver block mb-1">Biography</label>
        <textarea className="input-field text-sm min-h-[80px]" value={form.biography} onChange={e => setForm({...form, biography: e.target.value})} />
      </div>

      <div>
        <label className="text-xs text-silver block mb-1">Aliases (comma-separated)</label>
        <input className="input-field text-sm" value={form.aliases} onChange={e => setForm({...form, aliases: e.target.value})} placeholder="e.g. Air Jordan, MJ" />
      </div>

      <label className="flex items-center gap-2 text-sm text-silver cursor-pointer">
        <input type="checkbox" checked={form.hallOfFame} onChange={e => setForm({...form, hallOfFame: e.target.checked})} className="rounded" /> Hall of Fame
      </label>

      {/* Why Collectors Care */}
      <div>
        <label className="text-xs text-silver block mb-1">Why Collectors Care</label>
        <textarea className="input-field text-sm min-h-[80px]" value={form.whyCollectorsCare} onChange={e => setForm({...form, whyCollectorsCare: e.target.value})} placeholder="Custom text explaining why this player matters to collectors..." />
      </div>

      {/* Fun Facts */}
      <div>
        <label className="text-xs text-silver block mb-1">Fun Facts</label>
        <div className="space-y-1 mb-2">
          {form.funFacts.map((fact, i) => (
            <div key={i} className="flex items-center gap-2 bg-navy/50 rounded px-3 py-1.5">
              <span className="text-sm text-silver flex-1">{fact}</span>
              <button type="button" onClick={() => removeFact(i)} className="text-red-400 text-xs hover:underline">✕</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input-field text-sm flex-1" value={newFact} onChange={e => setNewFact(e.target.value)} placeholder="Add a fun fact..." onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFact(); } }} />
          <button type="button" onClick={addFact} className="btn-secondary text-xs px-3">Add</button>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <label className="text-xs text-silver block mb-1">Achievements</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {form.achievements.map((a, i) => (
            <span key={i} className="badge bg-amber-500/10 text-amber-300 px-2 py-1 flex items-center gap-1">
              {a}
              <button type="button" onClick={() => removeAchievement(i)} className="text-red-400 hover:text-red-300 ml-1">✕</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="input-field text-sm w-auto" value={newAchievement} onChange={e => { setNewAchievement(e.target.value); setCustomAchievement(''); }}>
            <option value="">Select achievement...</option>
            {ACHIEVEMENT_OPTIONS.filter(a => !form.achievements.includes(a)).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <input className="input-field text-sm flex-1 min-w-[150px]" value={customAchievement} onChange={e => { setCustomAchievement(e.target.value); setNewAchievement(''); }} placeholder="Or type custom..." />
          <button type="button" onClick={addAchievement} className="btn-secondary text-xs px-3">Add</button>
        </div>
      </div>

      {/* Career Timeline */}
      <div>
        <label className="text-xs text-silver block mb-1">Career Timeline</label>
        <div className="space-y-2 mb-2">
          {teamEntries.map((entry, i) => (
            <div key={i} className="flex flex-wrap gap-2 items-center bg-navy/50 rounded p-2">
              <select className="input-field text-sm w-auto flex-1 min-w-[160px]" value={entry.teamId} onChange={e => updateTeamEntry(i, 'teamId', e.target.value)}>
                <option value="">Select team...</option>
                {allTeams.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.sportName})</option>
                ))}
              </select>
              <input type="number" className="input-field text-sm w-20" placeholder="Start" value={entry.startYear || ''} onChange={e => updateTeamEntry(i, 'startYear', e.target.value ? parseInt(e.target.value) : null)} />
              <input type="number" className="input-field text-sm w-20" placeholder="End" value={entry.endYear || ''} onChange={e => updateTeamEntry(i, 'endYear', e.target.value ? parseInt(e.target.value) : null)} />
              <button type="button" onClick={() => removeTeamEntry(i)} className="text-red-400 text-sm hover:underline">✕</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addTeamEntry} className="btn-secondary text-xs">+ Add Team</button>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : 'Save All Changes'}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary text-sm">Cancel</button>
      </div>
    </form>
  );
}
