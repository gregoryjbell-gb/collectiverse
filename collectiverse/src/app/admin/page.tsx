'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/analytics').then((r) => {
      if (r.ok) setAuthenticated(true);
      setLoading(false);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm),
    });
    if (res.ok) {
      setAuthenticated(true);
    } else {
      const data = await res.json();
      setError(data.error || 'Login failed');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthenticated(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-silver">Loading...</div>;

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="card-surface p-8 w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="text-sm text-silver block mb-1">Username</label>
              <input id="username" type="text" className="input-field" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} required />
            </div>
            <div>
              <label htmlFor="password" className="text-sm text-silver block mb-1">Password</label>
              <input id="password" type="password" className="input-field" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="btn-primary w-full justify-center">Sign In</button>
          </form>
        </div>
      </main>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<'overview' | 'cards' | 'players'>('overview');
  const [analytics, setAnalytics] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/analytics').then((r) => r.json()).then(setAnalytics);
  }, []);

  useEffect(() => {
    if (tab === 'cards') fetch('/api/admin/cards').then((r) => r.json()).then((d) => setCards(d.cards || []));
    if (tab === 'players') fetch('/api/admin/players').then((r) => r.json()).then((d) => setPlayers(d.players || []));
  }, [tab]);

  const deleteCard = async (id: string) => {
    if (!confirm('Delete this card?')) return;
    await fetch(`/api/admin/cards/${id}`, { method: 'DELETE' });
    setCards(cards.filter((c) => c.id !== id));
  };

  const deletePlayer = async (id: string) => {
    if (!confirm('Delete this player?')) return;
    await fetch(`/api/admin/players/${id}`, { method: 'DELETE' });
    setPlayers(players.filter((p) => p.id !== id));
  };

  return (
    <main className="min-h-screen py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button onClick={onLogout} className="btn-secondary text-sm">Logout</button>
        </div>

        <nav className="flex gap-2 mb-8">
          {(['overview', 'cards', 'players'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg capitalize transition-colors ${tab === t ? 'bg-electric text-white' : 'bg-gunmetal/50 text-silver hover:text-white'}`}>
              {t}
            </button>
          ))}
        </nav>

        {tab === 'overview' && analytics && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card-surface p-5 text-center">
              <p className="text-3xl font-bold text-electric">{analytics.totalCards}</p>
              <p className="text-silver text-sm">Total Cards</p>
            </div>
            <div className="card-surface p-5 text-center">
              <p className="text-3xl font-bold text-electric">{analytics.totalPlayers}</p>
              <p className="text-silver text-sm">Players</p>
            </div>
            <div className="card-surface p-5 text-center">
              <p className="text-3xl font-bold text-electric">${analytics.totalValue?.toLocaleString()}</p>
              <p className="text-silver text-sm">Total Value</p>
            </div>
            <div className="card-surface p-5 text-center">
              <p className="text-3xl font-bold text-electric">{analytics.totalScans}</p>
              <p className="text-silver text-sm">QR Scans</p>
            </div>
          </div>
        )}

        {tab === 'overview' && analytics?.topScanned?.length > 0 && (
          <div className="card-surface p-6">
            <h2 className="text-xl font-semibold mb-4">Most Scanned Cards</h2>
            <div className="space-y-2">
              {analytics.topScanned.map((s: any) => (
                <div key={s.cardId} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0">
                  <span>{s.playerName}</span>
                  <span className="text-electric font-bold">{s.scans} scans</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'cards' && (
          <div className="space-y-3">
            {cards.map((card) => (
              <div key={card.id} className="card-surface p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{card.person?.displayName || 'Unknown'} — {card.set?.name} #{card.cardNumber}</p>
                  <p className="text-sm text-silver">{card.year} • {card.team?.name} • Status: {card.status}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`/cards/${card.id}`} className="text-electric text-sm hover:underline">View</a>
                  <button onClick={() => deleteCard(card.id)} className="text-red-400 text-sm hover:underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'players' && (
          <div className="space-y-3">
            {players.map((player) => (
              <div key={player.id} className="card-surface p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{player.displayName}</p>
                  <p className="text-sm text-silver">{player.personSports?.map((ps: any) => ps.sport.name).join(', ')} • {player._count?.cards} cards</p>
                </div>
                <div className="flex gap-2">
                  <a href={`/players/${player.id}`} className="text-electric text-sm hover:underline">View</a>
                  <button onClick={() => deletePlayer(player.id)} className="text-red-400 text-sm hover:underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
