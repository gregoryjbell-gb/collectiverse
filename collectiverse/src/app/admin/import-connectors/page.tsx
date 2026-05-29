'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CONNECTOR_TYPES = ['CSV', 'EXCEL', 'JSON', 'MANUAL', 'OCR_REVIEWED', 'WEB_CHECKLIST', 'API'];
const COLLECTIVERSE_FIELDS = ['year', 'manufacturer', 'brand', 'product', 'setName', 'series', 'cardNumber', 'subjectName', 'team', 'sport', 'cardCategory', 'parallel', 'variation', 'rookie', 'autograph', 'relic', 'serialNumber', 'printRun', 'sourceName', 'sourceUrl'];

export default function ImportConnectorsPage() {
  const [connectors, setConnectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', connectorType: 'CSV', fieldMap: {} as Record<string, string> });
  const [sourceColumns, setSourceColumns] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/import-connectors')
      .then(r => { if (r.status === 403) { router.push('/admin'); return null; } return r.json(); })
      .then(d => { if (d) setConnectors(d.connectors || []); })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/import-connectors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, connectorType: form.connectorType, configJson: { fieldMap: form.fieldMap } }),
    });
    if (res.ok) {
      setShowForm(false);
      const d = await res.json();
      setConnectors([d.connector, ...connectors]);
    }
  };

  const parsedColumns = sourceColumns.split(',').map(c => c.trim()).filter(Boolean);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Import Connectors</h1>
          <div className="flex gap-2">
            <Link href="/admin/import-jobs" className="btn-secondary text-sm">View Jobs</Link>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">{showForm ? 'Cancel' : '+ New Connector'}</button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="card-surface p-6 mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-silver">Name *</label><input className="input-field text-sm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
              <div><label className="text-xs text-silver">Type *</label>
                <select className="input-field text-sm" value={form.connectorType} onChange={e => setForm({...form, connectorType: e.target.value})}>
                  {CONNECTOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Field Mapping */}
            <div>
              <label className="text-xs text-silver block mb-1">Source Columns (comma-separated)</label>
              <input className="input-field text-sm" placeholder="e.g. Player,Team,Card_No,Year,Set_Name" value={sourceColumns} onChange={e => setSourceColumns(e.target.value)} />
            </div>

            {parsedColumns.length > 0 && (
              <div>
                <p className="text-xs text-silver mb-2">Map source columns to Collectiverse fields:</p>
                <div className="grid grid-cols-2 gap-2">
                  {parsedColumns.map(col => (
                    <div key={col} className="flex items-center gap-2">
                      <span className="text-xs text-silver w-28 truncate">{col}</span>
                      <span className="text-xs text-silver">→</span>
                      <select className="input-field text-xs flex-1" value={form.fieldMap[col] || ''} onChange={e => setForm({...form, fieldMap: {...form.fieldMap, [col]: e.target.value}})}>
                        <option value="">Skip</option>
                        {COLLECTIVERSE_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary text-sm">Create Connector</button>
          </form>
        )}

        {connectors.length === 0 && !showForm ? (
          <div className="card-surface p-8 text-center">
            <p className="text-silver">No connectors configured yet.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm mt-3">Create First Connector</button>
          </div>
        ) : (
          <div className="space-y-3">
            {connectors.map((c: any) => (
              <Link key={c.id} href={`/admin/import-connectors/${c.id}`} className="card-surface p-4 hover:border-electric/30 transition-colors block">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-silver">{c.connectorType} • {c._count?.jobs || 0} jobs</p>
                  </div>
                  <span className={`badge text-xs ${c.status === 'ACTIVE' ? 'bg-green-400/20 text-green-400' : 'bg-silver/20 text-silver'}`}>{c.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
