'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BillingPage() {
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/account/subscription')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setSub(d); })
      .finally(() => setLoading(false));
  }, []);

  const handlePortal = async () => {
    const res = await fetch('/api/billing/create-portal-session', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert(data.message || 'Portal not available yet');
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Billing</h1>

        <div className="card-surface p-6 mb-6">
          <h2 className="font-semibold mb-3">Current Plan</h2>
          <p className="text-lg font-bold text-electric">{sub?.plan?.name || 'Explorer (Free)'}</p>
          <p className="text-sm text-silver mt-1">{sub?.plan?.description || 'Basic free plan'}</p>
          {sub?.status && <p className="text-xs text-silver mt-2">Status: <span className={sub.status === 'ACTIVE' ? 'text-green-400' : 'text-amber-400'}>{sub.status}</span></p>}
          {sub?.currentPeriodEnd && <p className="text-xs text-silver">Renews: {new Date(sub.currentPeriodEnd).toLocaleDateString()}</p>}
          {sub?.cancelAtPeriodEnd && <p className="text-xs text-amber-400 mt-1">Cancels at end of period</p>}
        </div>

        <div className="flex gap-3">
          <Link href="/pricing" className="btn-primary text-sm">View Plans</Link>
          <button onClick={handlePortal} className="btn-secondary text-sm">Manage Billing</button>
        </div>
      </div>
    </main>
  );
}
