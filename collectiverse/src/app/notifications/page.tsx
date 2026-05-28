'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setNotifications(d.notifications || []); })
      .finally(() => setLoading(false));
  }, [router]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await fetch('/api/notifications/mark-all-read', { method: 'POST' });
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <button onClick={markAllRead} className="btn-secondary text-sm">Mark All Read</button>
        </div>

        {loading ? <div className="text-silver text-center py-12">Loading...</div> : notifications.length === 0 ? (
          <div className="card-surface p-12 text-center"><p className="text-silver">No notifications.</p></div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any) => (
              <div key={n.id} className={`card-surface p-4 flex justify-between items-start ${!n.read ? 'border-l-2 border-electric' : 'opacity-70'}`}>
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-silver">{n.message}</p>
                  <p className="text-[10px] text-silver/60 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.read && <button onClick={() => markRead(n.id)} className="text-electric text-xs hover:underline shrink-0">Read</button>}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
