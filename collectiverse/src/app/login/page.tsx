'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.login, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="card-surface p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">Sign In</h1>
        <p className="text-silver text-center text-sm mb-6">Access your collection</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login" className="text-sm text-silver block mb-1">Email or Username</label>
            <input id="login" type="text" className="input-field" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="password" className="text-sm text-silver block mb-1">Password</label>
            <input id="password" type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-silver text-sm mt-4">
          Don&apos;t have an account? <Link href="/register" className="text-electric hover:underline">Register</Link>
        </p>
      </div>
    </main>
  );
}
