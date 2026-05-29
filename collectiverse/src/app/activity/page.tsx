'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/activity')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setActivities(d.activities || []); })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Account Activity</h1>
          <Link href="/dashboard" className="text-sm text-silver hover:text-electric">← Dashboard</Link>
        </div>

        {activities.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Activity Yet</h2>
            <p className="text-silver text-sm mb-4">Your account activity log tracks actions like logins, inventory changes, and transactions.</p>
            <Link href="/dashboard" className="btn-primary text-sm">Back to Dashboard</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((a: any) => (
              <div key={a.id} className="card-surface p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{a.action || a.type}</p>
                  <p className="text-xs text-silver">{a.description || a.details || ''}</p>
                </div>
                <span className="text-xs text-silver">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
