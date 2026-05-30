'use client';

import { useState } from 'react';
import Link from 'next/link';

const TYPES = ['COPYRIGHT', 'INCORRECT_CARD_DATA', 'FAKE_LISTING', 'COUNTERFEIT_CONCERN', 'MARKETPLACE_ISSUE', 'LIVE_EVENT_ABUSE', 'USER_BEHAVIOR', 'OFFENSIVE_CONTENT', 'PRIVACY_CONCERN', 'OTHER'];

export default function ReportPage() {
  const [form, setForm] = useState({ type: 'OTHER', targetType: '', targetId: '', title: '', reason: '', url: '', evidenceUrl: '', reporterName: '', reporterEmail: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const res = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) setSubmitted(true);
    else { const d = await res.json(); setError(d.error || 'Failed'); }
  };

  if (submitted) return (<main className="min-h-screen py-12 px-6"><div className="max-w-lg mx-auto card-surface p-8 text-center"><p className="text-green-400 font-medium text-lg mb-2">Report Submitted</p><p className="text-silver text-sm">Thank you. Our team will review your report.</p><Link href="/" className="btn-secondary text-sm mt-4 inline-block">Back to Home</Link></div></main>);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-2">Report Content</h1>
        <p className="text-silver text-sm mb-6">Report incorrect data, copyright concerns, marketplace issues, or unsafe content.</p>
        <form onSubmit={handleSubmit} className="card-surface p-6 space-y-4">
          <div><label className="text-xs text-silver">Report Type *</label><select className="input-field text-sm" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>{TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}</select></div>
          <div><label className="text-xs text-silver">URL of content (optional)</label><input className="input-field text-sm" placeholder="https://..." value={form.url} onChange={e => setForm({...form, url: e.target.value})} /></div>
          <div><label className="text-xs text-silver">Title</label><input className="input-field text-sm" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div><label className="text-xs text-silver">Description *</label><textarea className="input-field text-sm min-h-[80px]" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} required /></div>
          <div><label className="text-xs text-silver">Evidence URL (optional)</label><input className="input-field text-sm" value={form.evidenceUrl} onChange={e => setForm({...form, evidenceUrl: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-silver">Your Name</label><input className="input-field text-sm" value={form.reporterName} onChange={e => setForm({...form, reporterName: e.target.value})} /></div>
            <div><label className="text-xs text-silver">Your Email</label><input type="email" className="input-field text-sm" value={form.reporterEmail} onChange={e => setForm({...form, reporterEmail: e.target.value})} /></div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="btn-primary text-sm">Submit Report</button>
        </form>
      </div>
    </main>
  );
}
