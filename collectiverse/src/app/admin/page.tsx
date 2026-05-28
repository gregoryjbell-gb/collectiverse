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
  const [tab, setTab] = useState<'overview' | 'cards' | 'players' | 'sets' | 'sports' | 'teams' | 'users'>('overview');
  const [analytics, setAnalytics] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [sets, setSets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [cardSearch, setCardSearch] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');
  const [setSearch, setSetSearch] = useState('');
  const [showSetForm, setShowSetForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [setForm, setSetFormState] = useState({ name: '', year: '', manufacturer: '', sportId: '', releaseDate: '' });
  const [userForm, setUserForm] = useState({ email: '', username: '', password: '', displayName: '', role: 'USER' });
  const [sports, setSports] = useState<any[]>([]);
  const [editingSet, setEditingSet] = useState<string | null>(null);
  const [editSetForm, setEditSetForm] = useState<any>({});
  const [showSportForm, setShowSportForm] = useState(false);
  const [sportForm, setSportForm] = useState({ name: '', league: '' });
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardForm, setCardForm] = useState({ personId: '', setId: '', teamId: '', year: '', cardNumber: '', parallel: '', rookie: false, autograph: false, relic: false, serialNumber: '', printRun: '', estimatedValue: '' });
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [playerForm, setPlayerForm] = useState({ displayName: '', biography: '', hallOfFame: false });
  const [teams, setTeams] = useState<any[]>([]);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', sportId: '', city: '' });

  useEffect(() => {
    fetch('/api/admin/analytics').then((r) => r.json()).then(setAnalytics);
  }, []);

  useEffect(() => {
    if (tab === 'cards') {
      fetch('/api/admin/cards').then((r) => r.json()).then((d) => setCards(d.cards || []));
      fetch('/api/admin/players').then((r) => r.json()).then((d) => setPlayers(d.players || []));
      fetch('/api/admin/sets').then((r) => r.json()).then((d) => setSets(d.sets || []));
      fetch('/api/admin/sports').then((r) => r.ok ? r.json() : { sports: [] }).then((d) => setSports(d.sports || [])).catch(() => {});
    }
    if (tab === 'players') {
      fetch('/api/admin/players').then((r) => r.json()).then((d) => setPlayers(d.players || []));
      fetch('/api/admin/sports').then((r) => r.ok ? r.json() : { sports: [] }).then((d) => setSports(d.sports || [])).catch(() => {});
    }
    if (tab === 'sets') {
      fetch('/api/admin/sets').then((r) => r.json()).then((d) => setSets(d.sets || []));
      fetch('/api/admin/sports').then((r) => r.ok ? r.json() : { sports: [] }).then((d) => setSports(d.sports || [])).catch(() => {});
    }
    if (tab === 'sports') {
      fetch('/api/admin/sports').then((r) => r.ok ? r.json() : { sports: [] }).then((d) => setSports(d.sports || [])).catch(() => {});
    }
    if (tab === 'teams') {
      fetch('/api/admin/teams').then((r) => r.ok ? r.json() : { teams: [] }).then((d) => setTeams(d.teams || [])).catch(() => {});
      fetch('/api/admin/sports').then((r) => r.ok ? r.json() : { sports: [] }).then((d) => setSports(d.sports || [])).catch(() => {});
    }
    if (tab === 'users') fetch('/api/admin/users').then((r) => r.json()).then((d) => setUsers(d.users || []));
  }, [tab]);

  const deleteCard = async (id: string) => {
    if (!confirm('Delete this card?')) return;
    await fetch(`/api/admin/cards/${id}`, { method: 'DELETE' });
    setCards(cards.filter((c) => c.id !== id));
  };
  const deletePlayer = async (id: string) => {
    if (!confirm('Delete this player and all their cards?')) return;
    await fetch(`/api/admin/players/${id}`, { method: 'DELETE' });
    setPlayers(players.filter((p) => p.id !== id));
  };
  const deleteSet = async (id: string) => {
    if (!confirm('Delete this set?')) return;
    await fetch(`/api/admin/sets/${id}`, { method: 'DELETE' });
    setSets(sets.filter((s) => s.id !== id));
  };
  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user and all their inventory?')) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) setUsers(users.filter((u) => u.id !== id));
    else { const d = await res.json(); alert(d.error); }
  };
  const createSet = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/sets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(setForm) });
    if (res.ok) { setShowSetForm(false); setSetFormState({ name: '', year: '', manufacturer: '', sportId: '', releaseDate: '' }); fetch('/api/admin/sets').then((r) => r.json()).then((d) => setSets(d.sets || [])); }
  };
  const startEditSet = (s: any) => {
    setEditingSet(s.id);
    setEditSetForm({ name: s.name, year: String(s.year), manufacturer: s.manufacturer || '', sportId: s.sport?.id || s.sportId || '', releaseDate: s.releaseDate || '' });
  };
  const saveEditSet = async (id: string) => {
    await fetch(`/api/admin/sets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editSetForm) });
    setEditingSet(null);
    fetch('/api/admin/sets').then((r) => r.json()).then((d) => setSets(d.sets || []));
  };
  const createSport = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/sports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sportForm) });
    if (res.ok) {
      setShowSportForm(false);
      setSportForm({ name: '', league: '' });
      fetch('/api/admin/sports').then((r) => r.ok ? r.json() : { sports: [] }).then((d) => setSports(d.sports || []));
    } else { const d = await res.json(); alert(d.error); }
  };
  const deleteSport = async (id: string) => {
    if (!confirm('Delete this sport? Sets and teams linked to it may be affected.')) return;
    await fetch(`/api/admin/sports/${id}`, { method: 'DELETE' });
    setSports(sports.filter(s => s.id !== id));
  };
  const createCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardForm.personId) { alert('Player is required'); return; }
    if (!cardForm.setId) { alert('Set is required'); return; }
    const body: any = { ...cardForm };
    if (body.year) body.year = parseInt(body.year);
    if (body.printRun) body.printRun = parseInt(body.printRun);
    if (body.estimatedValue) body.estimatedValue = parseFloat(body.estimatedValue);
    else delete body.estimatedValue;
    if (!body.teamId) delete body.teamId;
    if (!body.parallel) delete body.parallel;
    if (!body.serialNumber) delete body.serialNumber;
    if (!body.printRun) delete body.printRun;
    const res = await fetch('/api/admin/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      setShowCardForm(false);
      setCardForm({ personId: '', setId: '', teamId: '', year: '', cardNumber: '', parallel: '', rookie: false, autograph: false, relic: false, serialNumber: '', printRun: '', estimatedValue: '' });
      fetch('/api/admin/cards').then((r) => r.json()).then((d) => setCards(d.cards || []));
    } else { const d = await res.json(); alert(d.error || 'Failed to create card'); }
  };
  const createPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerForm.displayName) { alert('Display name is required'); return; }
    const res = await fetch('/api/admin/players', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(playerForm) });
    if (res.ok) {
      setShowPlayerForm(false);
      setPlayerForm({ displayName: '', biography: '', hallOfFame: false });
      fetch('/api/admin/players').then((r) => r.json()).then((d) => setPlayers(d.players || []));
    } else { const d = await res.json(); alert(d.error || 'Failed to create player'); }
  };
  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name || !teamForm.sportId) { alert('Name and sport are required'); return; }
    const res = await fetch('/api/admin/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(teamForm) });
    if (res.ok) {
      setShowTeamForm(false);
      setTeamForm({ name: '', sportId: '', city: '' });
      fetch('/api/admin/teams').then((r) => r.ok ? r.json() : { teams: [] }).then((d) => setTeams(d.teams || []));
    } else { const d = await res.json(); alert(d.error || 'Failed to create team'); }
  };
  const deleteTeam = async (id: string) => {
    if (!confirm('Delete this team?')) return;
    await fetch(`/api/admin/teams/${id}`, { method: 'DELETE' });
    setTeams(teams.filter(t => t.id !== id));
  };
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userForm) });
    if (res.ok) { setShowUserForm(false); setUserForm({ email: '', username: '', password: '', displayName: '', role: 'USER' }); fetch('/api/admin/users').then((r) => r.json()).then((d) => setUsers(d.users || [])); }
    else { const d = await res.json(); alert(d.error); }
  };

  // Filtered lists
  const filteredCards = cards.filter(c => {
    if (!cardSearch) return true;
    const q = cardSearch.toLowerCase();
    return (c.person?.displayName || '').toLowerCase().includes(q) || (c.set?.name || '').toLowerCase().includes(q) || (c.cardNumber || '').includes(q) || (c.team?.name || '').toLowerCase().includes(q) || String(c.year || '').includes(q);
  });
  const filteredPlayers = players.filter(p => {
    if (!playerSearch) return true;
    return p.displayName.toLowerCase().includes(playerSearch.toLowerCase());
  });
  const filteredSets = sets.filter(s => {
    if (!setSearch) return true;
    const q = setSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.manufacturer || '').toLowerCase().includes(q) || String(s.year).includes(q);
  });

  return (
    <main className="min-h-screen py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button onClick={onLogout} className="btn-secondary text-sm">Logout</button>
        </div>

        <nav className="flex gap-2 mb-8 flex-wrap">
          {(['overview', 'cards', 'players', 'sets', 'sports', 'teams', 'users'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg capitalize transition-colors ${tab === t ? 'bg-electric text-white' : 'bg-gunmetal/50 text-silver hover:text-white'}`}>
              {t}
            </button>
          ))}
        </nav>

        {/* Overview */}
        {tab === 'overview' && analytics && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="card-surface p-5 text-center"><p className="text-3xl font-bold text-electric">{analytics.totalCards}</p><p className="text-silver text-sm">Cards</p></div>
              <div className="card-surface p-5 text-center"><p className="text-3xl font-bold text-electric">{analytics.totalPlayers}</p><p className="text-silver text-sm">Players</p></div>
              <div className="card-surface p-5 text-center"><p className="text-3xl font-bold text-electric">${analytics.totalValue?.toLocaleString()}</p><p className="text-silver text-sm">Total Value</p></div>
              <div className="card-surface p-5 text-center"><p className="text-3xl font-bold text-electric">{analytics.totalScans}</p><p className="text-silver text-sm">QR Scans</p></div>
            </div>
            {analytics?.topScanned?.length > 0 && (
              <div className="card-surface p-6">
                <h2 className="text-lg font-semibold mb-3">Most Scanned</h2>
                {analytics.topScanned.map((s: any) => (
                  <div key={s.cardId} className="flex justify-between py-1.5 border-b border-silver/10 last:border-0 text-sm">
                    <span>{s.playerName}</span><span className="text-electric font-bold">{s.scans}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Cards */}
        {tab === 'cards' && (
          <div>
            <div className="flex gap-3 mb-4 items-center flex-wrap">
              <input type="search" className="input-field max-w-sm" placeholder="Search by player, set, team, year, card #..." value={cardSearch} onChange={e => setCardSearch(e.target.value)} />
              <span className="text-silver text-sm">{filteredCards.length} of {cards.length}</span>
              <button onClick={() => setShowCardForm(!showCardForm)} className="btn-primary text-sm ml-auto">{showCardForm ? 'Cancel' : '+ Add Card'}</button>
            </div>
            {showCardForm && (
              <form onSubmit={createCard} className="card-surface p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <select className="input-field text-sm" value={cardForm.personId} onChange={e => setCardForm({...cardForm, personId: e.target.value})} required>
                    <option value="">Player *</option>
                    {players.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                  </select>
                  <select className="input-field text-sm" value={cardForm.setId} onChange={e => setCardForm({...cardForm, setId: e.target.value})} required>
                    <option value="">Set *</option>
                    {sets.map(s => <option key={s.id} value={s.id}>{s.name} ({s.year})</option>)}
                  </select>
                  <select className="input-field text-sm" value={cardForm.teamId} onChange={e => setCardForm({...cardForm, teamId: e.target.value})}>
                    <option value="">Team (optional)</option>
                    {players.find(p => p.id === cardForm.personId)?.personTeams?.map((pt: any) => (
                      <option key={pt.team?.id || pt.id} value={pt.team?.id || ''}>{pt.team?.name || 'Unknown'}</option>
                    )) || []}
                  </select>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <input className="input-field text-sm" placeholder="Card #" value={cardForm.cardNumber} onChange={e => setCardForm({...cardForm, cardNumber: e.target.value})} />
                  <input type="number" className="input-field text-sm" placeholder="Year" value={cardForm.year} onChange={e => setCardForm({...cardForm, year: e.target.value})} />
                  <input className="input-field text-sm" placeholder="Parallel" value={cardForm.parallel} onChange={e => setCardForm({...cardForm, parallel: e.target.value})} />
                  <input type="number" step="0.01" className="input-field text-sm" placeholder="Est. Value ($)" value={cardForm.estimatedValue} onChange={e => setCardForm({...cardForm, estimatedValue: e.target.value})} />
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  <label className="flex items-center gap-1.5 text-sm text-silver cursor-pointer">
                    <input type="checkbox" checked={cardForm.rookie} onChange={e => setCardForm({...cardForm, rookie: e.target.checked})} /> Rookie
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-silver cursor-pointer">
                    <input type="checkbox" checked={cardForm.autograph} onChange={e => setCardForm({...cardForm, autograph: e.target.checked})} /> Auto
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-silver cursor-pointer">
                    <input type="checkbox" checked={cardForm.relic} onChange={e => setCardForm({...cardForm, relic: e.target.checked})} /> Relic
                  </label>
                  <input className="input-field text-sm w-32" placeholder="Serial #" value={cardForm.serialNumber} onChange={e => setCardForm({...cardForm, serialNumber: e.target.value})} />
                  <input type="number" className="input-field text-sm w-28" placeholder="Print Run" value={cardForm.printRun} onChange={e => setCardForm({...cardForm, printRun: e.target.value})} />
                  <button type="submit" className="btn-primary text-sm">Create Card</button>
                </div>
              </form>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-silver/20 text-left text-silver text-xs">
                  <th className="py-2 px-2">Player</th><th className="py-2 px-2">Set</th><th className="py-2 px-2">#</th><th className="py-2 px-2">Year</th><th className="py-2 px-2">Team</th><th className="py-2 px-2">Parallel</th><th className="py-2 px-2">Value</th><th className="py-2 px-2">Status</th><th className="py-2 px-2">Actions</th>
                </tr></thead>
                <tbody>
                  {filteredCards.map(card => (
                    <tr key={card.id} className="border-b border-silver/10 hover:bg-silver/5">
                      <td className="py-2 px-2 font-medium">{card.person?.displayName || '—'}</td>
                      <td className="py-2 px-2 text-silver">{card.set?.name || '—'}</td>
                      <td className="py-2 px-2 text-silver">{card.cardNumber || '—'}</td>
                      <td className="py-2 px-2 text-silver">{card.year || '—'}</td>
                      <td className="py-2 px-2 text-silver">{card.team?.name || '—'}</td>
                      <td className="py-2 px-2 text-silver">{card.parallel || '—'}</td>
                      <td className="py-2 px-2 text-electric">{card.estimatedValue ? `$${card.estimatedValue.toLocaleString()}` : '—'}</td>
                      <td className="py-2 px-2"><span className="badge bg-silver/10 text-silver text-xs">{card.status}</span></td>
                      <td className="py-2 px-2">
                        <div className="flex gap-2">
                          <a href={`/cards/${card.id}`} className="text-electric text-xs hover:underline">Edit</a>
                          <button onClick={() => deleteCard(card.id)} className="text-red-400 text-xs hover:underline">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Players */}
        {tab === 'players' && (
          <div>
            <div className="flex gap-3 mb-4 items-center flex-wrap">
              <input type="search" className="input-field max-w-sm" placeholder="Search players..." value={playerSearch} onChange={e => setPlayerSearch(e.target.value)} />
              <span className="text-silver text-sm">{filteredPlayers.length} of {players.length}</span>
              <button onClick={() => setShowPlayerForm(!showPlayerForm)} className="btn-primary text-sm ml-auto">{showPlayerForm ? 'Cancel' : '+ Add Player'}</button>
            </div>
            {showPlayerForm && (
              <form onSubmit={createPlayer} className="card-surface p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <input className="input-field text-sm" placeholder="Display Name *" value={playerForm.displayName} onChange={e => setPlayerForm({...playerForm, displayName: e.target.value})} required />
                  <input className="input-field text-sm" placeholder="Biography" value={playerForm.biography} onChange={e => setPlayerForm({...playerForm, biography: e.target.value})} />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-sm text-silver cursor-pointer">
                      <input type="checkbox" checked={playerForm.hallOfFame} onChange={e => setPlayerForm({...playerForm, hallOfFame: e.target.checked})} /> Hall of Fame
                    </label>
                    <button type="submit" className="btn-primary text-sm">Create Player</button>
                  </div>
                </div>
              </form>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-silver/20 text-left text-silver text-xs">
                  <th className="py-2 px-2">Name</th><th className="py-2 px-2">Sports</th><th className="py-2 px-2">HOF</th><th className="py-2 px-2">Cards</th><th className="py-2 px-2">Actions</th>
                </tr></thead>
                <tbody>
                  {filteredPlayers.map(player => (
                    <tr key={player.id} className="border-b border-silver/10 hover:bg-silver/5">
                      <td className="py-2 px-2 font-medium">{player.displayName}</td>
                      <td className="py-2 px-2 text-silver">{player.personSports?.map((ps: any) => ps.sport.name).join(', ') || '—'}</td>
                      <td className="py-2 px-2">{player.hallOfFame ? <span className="text-amber-400">✓</span> : '—'}</td>
                      <td className="py-2 px-2 text-silver">{player._count?.cards || 0}</td>
                      <td className="py-2 px-2">
                        <div className="flex gap-2">
                          <a href={`/players/${player.id}`} className="text-electric text-xs hover:underline">Edit</a>
                          <button onClick={() => deletePlayer(player.id)} className="text-red-400 text-xs hover:underline">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sets */}
        {tab === 'sets' && (
          <div>
            <div className="flex gap-3 mb-4 items-center flex-wrap">
              <input type="search" className="input-field max-w-sm" placeholder="Search sets..." value={setSearch} onChange={e => setSetSearch(e.target.value)} />
              <span className="text-silver text-sm">{filteredSets.length} of {sets.length}</span>
              <button onClick={() => setShowSetForm(!showSetForm)} className="btn-primary text-sm ml-auto">{showSetForm ? 'Cancel' : '+ Add Set'}</button>
            </div>
            {showSetForm && (
              <form onSubmit={createSet} className="card-surface p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <input className="input-field text-sm" placeholder="Name *" value={setForm.name} onChange={e => setSetFormState({...setForm, name: e.target.value})} required />
                  <input type="number" className="input-field text-sm" placeholder="Year *" value={setForm.year} onChange={e => setSetFormState({...setForm, year: e.target.value})} required />
                  <input className="input-field text-sm" placeholder="Manufacturer" value={setForm.manufacturer} onChange={e => setSetFormState({...setForm, manufacturer: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <select className="input-field text-sm" value={setForm.sportId} onChange={e => setSetFormState({...setForm, sportId: e.target.value})}>
                    <option value="">Select Sport...</option>
                    {sports.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                  </select>
                  <input type="date" className="input-field text-sm" placeholder="Release Date" value={setForm.releaseDate} onChange={e => setSetFormState({...setForm, releaseDate: e.target.value})} />
                  <button type="submit" className="btn-primary text-sm">Create Set</button>
                </div>
              </form>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-silver/20 text-left text-silver text-xs">
                  <th className="py-2 px-2">Name</th><th className="py-2 px-2">Year</th><th className="py-2 px-2">Manufacturer</th><th className="py-2 px-2">Sport</th><th className="py-2 px-2">Release</th><th className="py-2 px-2">Cards</th><th className="py-2 px-2">Actions</th>
                </tr></thead>
                <tbody>
                  {filteredSets.map(s => (
                    editingSet === s.id ? (
                      <tr key={s.id} className="border-b border-silver/10 bg-silver/5">
                        <td className="py-1 px-1"><input className="input-field text-xs py-1" value={editSetForm.name} onChange={e => setEditSetForm({...editSetForm, name: e.target.value})} /></td>
                        <td className="py-1 px-1"><input type="number" className="input-field text-xs py-1 w-20" value={editSetForm.year} onChange={e => setEditSetForm({...editSetForm, year: e.target.value})} /></td>
                        <td className="py-1 px-1"><input className="input-field text-xs py-1" value={editSetForm.manufacturer} onChange={e => setEditSetForm({...editSetForm, manufacturer: e.target.value})} /></td>
                        <td className="py-1 px-1">
                          <select className="input-field text-xs py-1" value={editSetForm.sportId} onChange={e => setEditSetForm({...editSetForm, sportId: e.target.value})}>
                            <option value="">None</option>
                            {sports.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                          </select>
                        </td>
                        <td className="py-1 px-1"><input type="date" className="input-field text-xs py-1" value={editSetForm.releaseDate} onChange={e => setEditSetForm({...editSetForm, releaseDate: e.target.value})} /></td>
                        <td className="py-1 px-1 text-silver">{s._count?.cards || 0}</td>
                        <td className="py-1 px-1">
                          <div className="flex gap-1">
                            <button onClick={() => saveEditSet(s.id)} className="text-green-400 text-xs hover:underline">Save</button>
                            <button onClick={() => setEditingSet(null)} className="text-silver text-xs hover:underline">Cancel</button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={s.id} className="border-b border-silver/10 hover:bg-silver/5">
                        <td className="py-2 px-2 font-medium">{s.name}</td>
                        <td className="py-2 px-2 text-silver">{s.year}</td>
                        <td className="py-2 px-2 text-silver">{s.manufacturer || '—'}</td>
                        <td className="py-2 px-2 text-silver">{s.sport?.name || '—'}</td>
                        <td className="py-2 px-2 text-silver">{s.releaseDate || '—'}</td>
                        <td className="py-2 px-2 text-silver">{s._count?.cards || 0}</td>
                        <td className="py-2 px-2">
                          <div className="flex gap-2">
                            <button onClick={() => startEditSet(s)} className="text-electric text-xs hover:underline">Edit</button>
                            <button onClick={() => deleteSet(s.id)} className="text-red-400 text-xs hover:underline">Del</button>
                          </div>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sports */}
        {tab === 'sports' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-silver text-sm">{sports.length} sports</span>
              <button onClick={() => setShowSportForm(!showSportForm)} className="btn-primary text-sm">{showSportForm ? 'Cancel' : '+ Add Sport'}</button>
            </div>
            {showSportForm && (
              <form onSubmit={createSport} className="card-surface p-4 mb-4 grid grid-cols-3 gap-3">
                <input className="input-field text-sm" placeholder="Name * (e.g. NFL, NBA)" value={sportForm.name} onChange={e => setSportForm({...sportForm, name: e.target.value})} required />
                <input className="input-field text-sm" placeholder="League (e.g. National Football League)" value={sportForm.league} onChange={e => setSportForm({...sportForm, league: e.target.value})} />
                <button type="submit" className="btn-primary text-sm">Create Sport</button>
              </form>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-silver/20 text-left text-silver text-xs">
                  <th className="py-2 px-2">Name</th><th className="py-2 px-2">League</th><th className="py-2 px-2">Actions</th>
                </tr></thead>
                <tbody>
                  {sports.map(sp => (
                    <tr key={sp.id} className="border-b border-silver/10 hover:bg-silver/5">
                      <td className="py-2 px-2 font-medium">{sp.name}</td>
                      <td className="py-2 px-2 text-silver">{sp.league || '—'}</td>
                      <td className="py-2 px-2">
                        <button onClick={() => deleteSport(sp.id)} className="text-red-400 text-xs hover:underline">Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Teams */}
        {tab === 'teams' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-silver text-sm">{teams.length} teams</span>
              <button onClick={() => setShowTeamForm(!showTeamForm)} className="btn-primary text-sm">{showTeamForm ? 'Cancel' : '+ Add Team'}</button>
            </div>
            {showTeamForm && (
              <form onSubmit={createTeam} className="card-surface p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <input className="input-field text-sm" placeholder="Team Name *" value={teamForm.name} onChange={e => setTeamForm({...teamForm, name: e.target.value})} required />
                <select className="input-field text-sm" value={teamForm.sportId} onChange={e => setTeamForm({...teamForm, sportId: e.target.value})} required>
                  <option value="">Sport *</option>
                  {sports.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                </select>
                <input className="input-field text-sm" placeholder="City" value={teamForm.city} onChange={e => setTeamForm({...teamForm, city: e.target.value})} />
                <button type="submit" className="btn-primary text-sm">Create Team</button>
              </form>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-silver/20 text-left text-silver text-xs">
                  <th className="py-2 px-2">Name</th><th className="py-2 px-2">Sport</th><th className="py-2 px-2">City</th><th className="py-2 px-2">Actions</th>
                </tr></thead>
                <tbody>
                  {teams.map(t => (
                    <tr key={t.id} className="border-b border-silver/10 hover:bg-silver/5">
                      <td className="py-2 px-2 font-medium">{t.name}</td>
                      <td className="py-2 px-2 text-silver">{t.sport?.name || '—'}</td>
                      <td className="py-2 px-2 text-silver">{t.city || '—'}</td>
                      <td className="py-2 px-2">
                        <button onClick={() => deleteTeam(t.id)} className="text-red-400 text-xs hover:underline">Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-silver text-sm">{users.length} users</span>
              <button onClick={() => setShowUserForm(!showUserForm)} className="btn-primary text-sm">{showUserForm ? 'Cancel' : '+ Add User'}</button>
            </div>
            {showUserForm && (
              <form onSubmit={createUser} className="card-surface p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <input type="email" className="input-field text-sm" placeholder="Email *" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} required />
                  <input className="input-field text-sm" placeholder="Username" value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} />
                  <input type="password" className="input-field text-sm" placeholder="Password *" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} required />
                  <input className="input-field text-sm" placeholder="Display Name" value={userForm.displayName} onChange={e => setUserForm({...userForm, displayName: e.target.value})} />
                </div>
                <div className="flex gap-3 items-center">
                  <select className="input-field text-sm w-auto" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <button type="submit" className="btn-primary text-sm">Create User</button>
                </div>
              </form>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-silver/20 text-left text-silver text-xs">
                  <th className="py-2 px-2">Name</th><th className="py-2 px-2">Email</th><th className="py-2 px-2">Username</th><th className="py-2 px-2">Role</th><th className="py-2 px-2">Items</th><th className="py-2 px-2">Actions</th>
                </tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-silver/10 hover:bg-silver/5">
                      <td className="py-2 px-2 font-medium">{u.displayName || '—'}</td>
                      <td className="py-2 px-2 text-silver">{u.email}</td>
                      <td className="py-2 px-2 text-silver">{u.username || '—'}</td>
                      <td className="py-2 px-2"><span className={u.role === 'ADMIN' ? 'text-amber-400' : 'text-silver'}>{u.role}</span></td>
                      <td className="py-2 px-2 text-silver">{u._count?.inventoryItems || 0}</td>
                      <td className="py-2 px-2">
                        <button onClick={() => deleteUser(u.id)} className="text-red-400 text-xs hover:underline">Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
