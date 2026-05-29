'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function ConnectorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [connector, setConnector] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [csvData, setCsvData] = useState('');
  const [jobResult, setJobResult] = useState<any>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/import-connectors/${id}`)
      .then(r => { if (r.status === 403) { router.push('/admin'); return null; } return r.json(); })
      .then(d => { if (d) setConnector(d.connector); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvData(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleRunJob = async () => {
    if (!csvData) return;
    setRunning(true);
    setJobResult(null);
    const res = await fetch('/api/admin/import-jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectorId: id, csvData }),
    });
    const data = await res.json();
    setJobResult(data);
    setRunning(false);
  };

  const handleConfirm = async (jobId: string) => {
    await fetch(`/api/admin/import-jobs/${jobId}/confirm`, { method: 'POST' });
    setJobResult(null);
    // Reload connector to show updated jobs
    fetch(`/api/admin/import-connectors/${id}`).then(r => r.json()).then(d => { if (d) setConnector(d.connector); });
  };

  const handleCancel = async (jobId: string) => {
    await fetch(`/api/admin/import-jobs/${jobId}/cancel`, { method: 'POST' });
    setJobResult(null);
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!connector) return null;

  const config = connector.configJson ? JSON.parse(connector.configJson) : {};

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{connector.name}</h1>
          <Link href="/admin/import-connectors" className="text-sm text-silver hover:text-electric">← Connectors</Link>
        </div>

        <div className="card-surface p-5 mb-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-silver">Type:</span> {connector.connectorType}</div>
            <div><span className="text-silver">Status:</span> <span className={connector.status === 'ACTIVE' ? 'text-green-400' : 'text-silver'}>{connector.status}</span></div>
            <div><span className="text-silver">Jobs:</span> {connector.jobs?.length || 0}</div>
          </div>
          {config.fieldMap && Object.keys(config.fieldMap).length > 0 && (
            <div className="mt-3 pt-3 border-t border-silver/10">
              <p className="text-xs text-silver mb-1">Field Mappings:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(config.fieldMap).map(([src, dst]) => (
                  <span key={src} className="text-xs bg-gunmetal/50 px-2 py-0.5 rounded">{src} → {dst as string}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Run new job */}
        <div className="card-surface p-5 mb-6">
          <h2 className="font-semibold text-sm mb-3">Run Import Job</h2>
          <input type="file" accept=".csv,.json,.xlsx" onChange={handleFileUpload} className="text-sm text-silver mb-3 block" />
          {csvData && <p className="text-xs text-silver mb-2">{csvData.trim().split('\n').length - 1} rows loaded</p>}
          <button onClick={handleRunJob} disabled={!csvData || running} className="btn-primary text-sm">{running ? 'Analyzing...' : 'Preview Import'}</button>

          {jobResult && (
            <div className="mt-4 p-4 bg-gunmetal/30 rounded-lg">
              <p className="text-sm font-medium mb-2">Preview Results</p>
              <div className="grid grid-cols-4 gap-3 text-xs mb-3">
                <div><span className="text-silver">Total:</span> {jobResult.stats?.total}</div>
                <div><span className="text-green-400">Valid:</span> {jobResult.stats?.valid}</div>
                <div><span className="text-amber-400">Duplicates:</span> {jobResult.stats?.duplicates}</div>
                <div><span className="text-red-400">Errors:</span> {jobResult.stats?.errors}</div>
              </div>
              {jobResult.preview?.length > 0 && (
                <div className="overflow-x-auto mb-3">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-silver/20 text-silver">
                      <th className="py-1 px-2 text-left">Subject</th><th className="py-1 px-2 text-left">Set</th><th className="py-1 px-2 text-left">#</th><th className="py-1 px-2 text-left">Year</th>
                    </tr></thead>
                    <tbody>
                      {jobResult.preview.slice(0, 5).map((row: any, i: number) => (
                        <tr key={i} className="border-b border-silver/10">
                          <td className="py-1 px-2">{row.subjectName}</td>
                          <td className="py-1 px-2 text-silver">{row.setName}</td>
                          <td className="py-1 px-2">{row.cardNumber}</td>
                          <td className="py-1 px-2">{row.year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => handleConfirm(jobResult.job.id)} className="btn-primary text-xs">Confirm Import</button>
                <button onClick={() => handleCancel(jobResult.job.id)} className="btn-secondary text-xs">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Job history */}
        {connector.jobs?.length > 0 && (
          <div className="card-surface p-5">
            <h2 className="font-semibold text-sm mb-3">Job History</h2>
            <div className="space-y-2">
              {connector.jobs.map((job: any) => (
                <div key={job.id} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0 text-sm">
                  <div>
                    <p className="text-xs text-silver">{new Date(job.createdAt).toLocaleString()}</p>
                    <p className="text-xs">{job.totalRecords} records • {job.validRecords} valid • {job.duplicateRecords} dupes</p>
                  </div>
                  <span className={`badge text-xs ${job.status === 'IMPORTED' ? 'bg-green-400/20 text-green-400' : job.status === 'PREVIEW_READY' ? 'bg-blue-400/20 text-blue-400' : 'bg-silver/20 text-silver'}`}>{job.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
