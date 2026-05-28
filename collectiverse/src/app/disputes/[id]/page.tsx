'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DisputeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [dispute, setDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const load = () => {
    fetch(`/api/disputes/${id}`)
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } if (!r.ok) { router.push('/disputes'); return null; } return r.json(); })
      .then(d => { if (d) setDispute(d.dispute); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    await fetch(`/api/disputes/${id}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: newMessage }) });
    setNewMessage('');
    setSending(false);
    load();
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!dispute) return null;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/disputes" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back</Link>

        <div className="card-surface p-6 mb-6">
          <div className="flex justify-between items-start mb-3">
            <div className="flex gap-2">
              <span className={`badge ${dispute.status === 'OPEN' ? 'bg-red-500/20 text-red-400' : dispute.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{dispute.status}</span>
              <span className="badge bg-silver/10 text-silver">{dispute.reason.replace(/_/g, ' ')}</span>
            </div>
            <span className="text-xs text-silver">{new Date(dispute.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-sm">{dispute.description}</p>
          {dispute.resolution && <p className="text-sm text-green-400 mt-2">Resolution: {dispute.resolution}</p>}
          {dispute.adminNotes && <p className="text-xs text-silver mt-1">Admin: {dispute.adminNotes}</p>}
        </div>

        <h2 className="text-lg font-semibold mb-3">Messages ({dispute.messages?.length || 0})</h2>
        <div className="space-y-2 mb-6">
          {(dispute.messages || []).map((m: any) => (
            <div key={m.id} className="card-surface p-3">
              <p className="text-sm">{m.message}</p>
              <p className="text-[10px] text-silver mt-1">{new Date(m.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>

        {dispute.status !== 'RESOLVED' && dispute.status !== 'CLOSED' && (
          <form onSubmit={sendMessage} className="flex gap-2">
            <input className="input-field flex-1" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Add message..." />
            <button type="submit" disabled={sending} className="btn-primary text-sm">{sending ? '...' : 'Send'}</button>
          </form>
        )}
      </div>
    </main>
  );
}
