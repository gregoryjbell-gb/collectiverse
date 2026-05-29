'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminComicImportPage() {
  const router = useRouter();
  const [csvData, setCsvData] = useState('');
  const [sourceName, setSourceName] = useState('Comic Public Checklist');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvData(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true); setError(''); setResult(null);
    const res = await fetch('/api/admin/import/comics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csvData, sourceName }) });
    const data = await res.json();
    if (res.ok) setResult(data);
    else setError(data.error || 'Import failed');
    setImporting(false);
  };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Import Comics</h1>
          <Link href="/admin/import" className="text-sm text-silver hover:text-electric">← All Imports</Link>
        </div>

        <div className="card-surface p-6 space-y-4">
          <p className="text-sm text-silver">Upload a CSV with columns: publisher, seriesTitle, volume, issueNumber, issueTitle, coverDate, writer, artist, coverArtist, universe, genre, keyIssue, firstAppearance, variantCover, variantName, printRun, upc, isbn</p>
          <div><label className="text-xs text-silver">Source Name</label><input className="input-field text-sm" value={sourceName} onChange={e => setSourceName(e.target.value)} /></div>
          <div><label className="text-xs text-silver">CSV File</label><input type="file" accept=".csv" onChange={handleFile} className="text-sm text-silver" /></div>
          {csvData && <p className="text-xs text-green-400">{csvData.trim().split('\n').length - 1} rows loaded</p>}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {result && (
            <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-4">
              <p className="text-green-400 font-medium text-sm">Import Complete</p>
              <p className="text-xs text-silver">Created: {result.batch.imported} • Skipped: {result.batch.skipped} • Errors: {result.batch.errors}</p>
            </div>
          )}
          <button onClick={handleImport} disabled={!csvData || importing} className="btn-primary text-sm">{importing ? 'Importing...' : 'Import Comics'}</button>
        </div>
      </div>
    </main>
  );
}
