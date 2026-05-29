'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminImportPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<any[]>([]);
  const [csvData, setCsvData] = useState('');
  const [form, setForm] = useState({
    sourceName: '1989 Score Football Public Checklist',
    sourceType: 'PUBLIC_CHECKLIST',
    permissionStatus: 'PUBLIC_FACTS_ONLY',
    fileName: '',
  });
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/import')
      .then(r => { if (r.status === 403) { router.push('/admin'); return null; } return r.json(); })
      .then(d => { if (d) setBatches(d.batches || []); })
      .finally(() => setLoading(false));
  }, [result]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm({ ...form, fileName: file.name });
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvData(text);
      // Parse preview
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1, 6).map(line => {
        const values = line.split(',');
        const row: any = {};
        headers.forEach((h, i) => { row[h] = values[i]?.trim() || ''; });
        return row;
      });
      setPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvData) { setError('No CSV data loaded'); return; }
    setImporting(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData, ...form }),
      });
      const data = await res.json();
      if (res.ok) { setResult(data); setCsvData(''); setPreview([]); }
      else { setError(data.error || 'Import failed'); }
    } finally { setImporting(false); }
  };

  const handleRollback = async (batchId: string) => {
    if (!confirm('Roll back this import? All cards and persons created by this batch will be deleted.')) return;
    const res = await fetch(`/api/admin/import/${batchId}/rollback`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) { alert(`Rolled back: ${data.deletedCards} cards, ${data.deletedPersons} persons deleted`); setBatches(batches.map(b => b.id === batchId ? { ...b, status: 'ROLLED_BACK' } : b)); }
    else { alert(data.error || 'Rollback failed'); }
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Card Import</h1>
          <Link href="/admin" className="text-sm text-silver hover:text-electric">← Admin</Link>
        </div>

        {/* Import Form */}
        <div className="card-surface p-6 mb-6">
          <h2 className="font-semibold mb-4">Import CSV</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><label className="text-xs text-silver">Source Name *</label><input className="input-field text-sm" value={form.sourceName} onChange={e => setForm({...form, sourceName: e.target.value})} /></div>
            <div>
              <label className="text-xs text-silver">Source Type</label>
              <select className="input-field text-sm" value={form.sourceType} onChange={e => setForm({...form, sourceType: e.target.value})}>
                <option value="PUBLIC_CHECKLIST">Public Checklist</option>
                <option value="LICENSED_DATA">Licensed Data</option>
                <option value="USER_UPLOAD">User Upload</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs text-silver block mb-1">CSV File</label>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="text-sm text-silver" />
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-silver mb-2">Preview (first 5 rows):</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-silver/20 text-silver">
                    <th className="py-1 px-2 text-left">#</th>
                    <th className="py-1 px-2 text-left">Subject</th>
                    <th className="py-1 px-2 text-left">Team</th>
                    <th className="py-1 px-2 text-left">Card #</th>
                    <th className="py-1 px-2 text-left">Rookie</th>
                  </tr></thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-silver/10">
                        <td className="py-1 px-2">{row.cardNumber}</td>
                        <td className="py-1 px-2 font-medium">{row.subjectName}</td>
                        <td className="py-1 px-2 text-silver">{row.team}</td>
                        <td className="py-1 px-2">{row.cardNumber}</td>
                        <td className="py-1 px-2">{row.rookie === 'true' ? '✓' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-silver mt-1">{csvData.trim().split('\n').length - 1} total rows</p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

          {result && (
            <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-4 mb-3">
              <p className="text-green-400 font-medium text-sm">Import Complete</p>
              <p className="text-xs text-silver mt-1">Cards created: {result.createdCards} • Persons created: {result.createdPersons} • Skipped: {result.batch.skippedRows}</p>
              {result.errors?.length > 0 && <p className="text-xs text-amber-400 mt-1">Warnings: {result.errors.length}</p>}
            </div>
          )}

          <button onClick={handleImport} disabled={importing || !csvData} className="btn-primary text-sm">
            {importing ? 'Importing...' : 'Import Cards'}
          </button>
        </div>

        {/* Import History */}
        <div className="card-surface p-6">
          <h2 className="font-semibold mb-4">Import History</h2>
          {batches.length === 0 ? (
            <p className="text-silver text-sm">No imports yet.</p>
          ) : (
            <div className="space-y-2">
              {batches.map((batch: any) => (
                <div key={batch.id} className="flex justify-between items-center py-3 border-b border-silver/10 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{batch.sourceName}</p>
                    <p className="text-xs text-silver">{batch.fileName || 'Manual'} • {batch.importedRows} imported, {batch.skippedRows} skipped • {new Date(batch.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge text-xs ${batch.status === 'COMPLETED' ? 'bg-green-400/20 text-green-400' : batch.status === 'ROLLED_BACK' ? 'bg-red-400/20 text-red-400' : 'bg-silver/20 text-silver'}`}>{batch.status}</span>
                    {batch.status === 'COMPLETED' && (
                      <button onClick={() => handleRollback(batch.id)} className="text-red-400 text-xs hover:underline">Rollback</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
