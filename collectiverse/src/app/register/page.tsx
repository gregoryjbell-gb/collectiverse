'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="card-surface p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">Create Account</h1>
        <p className="text-silver text-center text-sm mb-6">Start tracking your collection</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm text-silver block mb-1">Email *</label>
            <input id="email" type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="username" className="text-sm text-silver block mb-1">Username</label>
            <input id="username" type="text" className="input-field" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div>
            <label htmlFor="displayName" className="text-sm text-silver block mb-1">Display Name</label>
            <input id="displayName" type="text" className="input-field" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          </div>
          <div>
            <label htmlFor="password" className="text-sm text-silver block mb-1">Password *</label>
            <input id="password" type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-silver text-sm mt-4">
          Already have an account? <Link href="/login" className="text-electric hover:underline">Sign In</Link>
        </p>
      </div>
    </main>
  );
}
