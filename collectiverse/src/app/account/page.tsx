'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const [form, setForm] = useState({ displayName: '', username: '', email: '' });

  useEffect(() => {
    fetch('/api/me')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => {
        if (d?.user) {
          setUser(d.user);
          setForm({ displayName: d.user.displayName || '', username: d.user.username || '', email: d.user.email || '' });
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMessage('Profile updated');
        const data = await res.json();
        setUser(data.user);
      } else {
        const d = await res.json();
        setMessage(d.error || 'Failed to update');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!user) return null;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Account</h1>

        <form onSubmit={handleSave} className="card-surface p-6 space-y-4">
          <div>
            <label className="text-sm text-silver block mb-1">Display Name</label>
            <input className="input-field" value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} />
          </div>
          <div>
            <label className="text-sm text-silver block mb-1">Username</label>
            <input className="input-field" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
          </div>
          <div>
            <label className="text-sm text-silver block mb-1">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>

          <div className="card-surface p-4 bg-navy/30">
            <p className="text-xs text-silver">Role: <span className="text-electric font-medium">{user.role}</span></p>
            <p className="text-xs text-silver">Member since: {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>

          {message && <p className={`text-sm ${message.includes('updated') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}

          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>
    </main>
  );
}
