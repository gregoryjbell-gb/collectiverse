'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SOURCE_APPS = [
  { value: 'LUDEX', label: 'Ludex' },
  { value: 'COLLECTR', label: 'Collectr' },
  { value: 'COLLX', label: 'CollX' },
  { value: 'CARDLY_AI', label: 'Cardly AI' },
  { value: 'CARD_GRADER', label: 'Card Grader' },
  { value: 'GENERIC', label: 'Generic CSV / Spreadsheet' },
];

const TARGET_FIELDS = [
  { group: 'Card Identity', fields: ['year', 'manufacturer', 'setName', 'series', 'cardNumber', 'subjectName', 'team', 'sport', 'cardCategory', 'parallel', 'variation'] },
  { group: 'Inventory', fields: ['quantity', 'condition', 'gradeCompany', 'gradeValue', 'certNumber', 'acquisitionDate', 'purchasePrice', 'estimatedValue', 'askingPrice', 'status', 'storageLocation', 'notes'] },
];

export default function InventoryImportPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [sourceApp, setSourceApp] = useState('GENERIC');
  const [csvData, setCsvData] = useState('');
  const [filename, setFilename] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
  const [batchId, setBatchId] = useState('');
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createNewCards, setCreateNewCards] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setCsvData(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!csvData) return;
    setLoading(true); setError('');
    const res = await fetch('/api/inventory/import/upload', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvData, sourceApp, filename }),
    });
    const data = await res.json();
    if (res.ok) {
      setBatchId(data.batch.id);
      setHeaders(data.headers || []);
      setPreview(data.preview || []);
      setStep(2);
    } else { setError(data.error || 'Upload failed'); }
    setLoading(false);
  };

  const handleMap = async () => {
    setLoading(true); setError('');
    const res = await fetch(`/api/inventory/import/${batchId}/map`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldMap }),
    });
    if (res.ok) setStep(3);
    else { const d = await res.json(); setError(d.error || 'Mapping failed'); }
    setLoading(false);
  };

  const handlePreview = async () => {
    setLoading(true); setError('');
    const res = await fetch(`/api/inventory/import/${batchId}/preview`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) { setPreviewResult(data); setStep(4); }
    else { setError(data.error || 'Preview failed'); }
    setLoading(false);
  };

  const handleConfirm = async () => {
    setLoading(true);
    const res = await fetch(`/api/inventory/import/${batchId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ createNewCards }),
    });
    if (res.ok) router.push('/inventory');
    else { const d = await res.json(); setError(d.error || 'Import failed'); }
    setLoading(false);
  };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Import Inventory</h1>
          <Link href="/inventory" className="text-sm text-silver hover:text-electric">← Inventory</Link>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-6">
          {['Upload', 'Map Fields', 'Preview', 'Confirm'].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${step > i + 1 ? 'bg-green-400 text-white' : step === i + 1 ? 'bg-electric text-white' : 'bg-gunmetal/50 text-silver'}`}>{step > i + 1 ? '✓' : i + 1}</div>
              {i < 3 && <div className={`w-6 h-0.5 ${step > i + 1 ? 'bg-green-400' : 'bg-silver/20'}`} />}
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="card-surface p-6 space-y-4">
            <h2 className="font-semibold">Upload Your Collection</h2>
            <p className="text-sm text-silver">Export your collection from another app and upload the CSV here.</p>
            <div>
              <label className="text-xs text-silver block mb-1">Source App</label>
              <select className="input-field text-sm" value={sourceApp} onChange={e => setSourceApp(e.target.value)}>
                {SOURCE_APPS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-silver block mb-1">CSV File</label>
              <input type="file" accept=".csv,.xlsx" onChange={handleFileUpload} className="text-sm text-silver" />
            </div>
            {csvData && <p className="text-xs text-green-400">{csvData.trim().split('\n').length - 1} rows detected</p>}
            <button onClick={handleUpload} disabled={!csvData || loading} className="btn-primary text-sm">{loading ? 'Uploading...' : 'Upload & Continue'}</button>
          </div>
        )}

        {/* Step 2: Map Fields */}
        {step === 2 && (
          <div className="card-surface p-6 space-y-4">
            <h2 className="font-semibold">Map Your Columns</h2>
            <p className="text-sm text-silver">Tell us which columns in your file correspond to which fields.</p>
            {TARGET_FIELDS.map(group => (
              <div key={group.group}>
                <p className="text-xs text-silver uppercase tracking-wider mb-2">{group.group}</p>
                <div className="grid grid-cols-2 gap-2">
                  {group.fields.map(field => (
                    <div key={field} className="flex items-center gap-2">
                      <span className="text-xs w-28 text-silver">{field}</span>
                      <select className="input-field text-xs flex-1" value={fieldMap[field] || ''} onChange={e => {
                        const newMap = { ...fieldMap };
                        // Reverse map: target -> source
                        if (e.target.value) newMap[e.target.value] = field;
                        setFieldMap(newMap);
                      }}>
                        <option value="">— skip —</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {preview.length > 0 && (
              <details className="border border-silver/10 rounded-lg p-3">
                <summary className="text-xs text-silver cursor-pointer">Preview raw data</summary>
                <pre className="text-xs text-silver mt-2 overflow-x-auto">{JSON.stringify(preview[0], null, 2)}</pre>
              </details>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary text-sm">Back</button>
              <button onClick={handleMap} disabled={loading} className="btn-primary text-sm">{loading ? 'Mapping...' : 'Apply Mapping'}</button>
              <button onClick={handlePreview} disabled={loading} className="btn-primary text-sm">Preview Matches</button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && (
          <div className="card-surface p-6 space-y-4">
            <h2 className="font-semibold">Analyzing Matches...</h2>
            <p className="text-sm text-silver">Matching your cards against the Collectiverse database.</p>
            <button onClick={handlePreview} disabled={loading} className="btn-primary text-sm">{loading ? 'Analyzing...' : 'Run Preview'}</button>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && previewResult && (
          <div className="card-surface p-6 space-y-4">
            <h2 className="font-semibold">Import Preview</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <div className="text-center"><p className="text-xl font-bold text-green-400">{previewResult.exactMatch || 0}</p><p className="text-xs text-silver">Exact</p></div>
              <div className="text-center"><p className="text-xl font-bold text-blue-400">{previewResult.highConfidence || 0}</p><p className="text-xs text-silver">High Conf.</p></div>
              <div className="text-center"><p className="text-xl font-bold text-amber-400">{previewResult.possibleMatch || 0}</p><p className="text-xs text-silver">Possible</p></div>
              <div className="text-center"><p className="text-xl font-bold text-red-400">{previewResult.noMatch || 0}</p><p className="text-xs text-silver">No Match</p></div>
              <div className="text-center"><p className="text-xl font-bold text-purple-400">{previewResult.duplicates}</p><p className="text-xs text-silver">Duplicates</p></div>
              <div className="text-center"><p className="text-xl font-bold text-silver">{previewResult.errors}</p><p className="text-xs text-silver">Errors</p></div>
            </div>

            <div className="border-t border-silver/10 pt-3">
              <p className="text-sm font-medium mb-2">Import Options</p>
              <p className="text-xs text-silver mb-1"><span className="text-green-400">Exact + High Confidence</span> matches will be auto-imported.</p>
              {(previewResult.possibleMatch || 0) > 0 && (
                <p className="text-xs text-silver mb-1"><span className="text-amber-400">{previewResult.possibleMatch}</span> possible matches will use the best candidate (you can review in batch detail later).</p>
              )}
              <p className="text-xs text-silver mb-2"><span className="text-green-400 font-bold">{previewResult.matched}</span> cards total will be added to your inventory.</p>
              {previewResult.noMatch > 0 && (
                <label className="flex items-center gap-2 text-sm text-silver cursor-pointer mb-2">
                  <input type="checkbox" checked={createNewCards} onChange={e => setCreateNewCards(e.target.checked)} />
                  Also create <span className="text-amber-400 font-bold">{previewResult.noMatch}</span> new public card records for unmatched rows
                  <span className="text-xs text-silver">(marked for admin review)</span>
                </label>
              )}
              {previewResult.duplicates > 0 && (
                <p className="text-xs text-silver"><span className="text-purple-400">{previewResult.duplicates}</span> rows appear to be duplicates of cards you already own and will be skipped.</p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary text-sm">Back to Mapping</button>
              <button onClick={handleConfirm} disabled={loading || (previewResult.matched === 0 && !createNewCards)} className="btn-primary">{loading ? 'Importing...' : `Import ${previewResult.matched + (createNewCards ? previewResult.newCard : 0)} Cards`}</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
