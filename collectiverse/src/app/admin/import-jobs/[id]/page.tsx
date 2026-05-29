'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ImportJobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadStatus = () => {
    fetch(`/api/admin/import-jobs/${id}/status`)
      .then(r => { if (r.status === 403) { router.push('/admin'); return null; } return r.json(); })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStatus(); }, [id]);

  // Poll while running
  useEffect(() => {
    if (data?.latestJob?.status === 'RUNNING') {
      pollRef.current = setInterval(loadStatus, 2000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [data?.latestJob?.status]);

  const handleRun = async (jobType: string) => {
    setRunning(true);
    await fetch(`/api/admin/import-jobs/${id}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobType }),
    });
    setTimeout(loadStatus, 500);
    setRunning(false);
  };

  const handleCancel = async () => {
    if (!data?.latestJob) return;
    await fetch(`/api/admin/import-jobs/${id}/cancel`, { method: 'POST' });
    loadStatus();
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return null;

  const { importJob, latestJob, progress } = data;
  const isRunning = latestJob?.status === 'RUNNING';
  const isCompleted = latestJob?.status === 'COMPLETED';
  const isFailed = latestJob?.status === 'FAILED';

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Import Job</h1>
          <Link href="/admin/import-jobs" className="text-sm text-silver hover:text-electric">← All Jobs</Link>
        </div>

        {/* Status card */}
        <div className="card-surface p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-silver">Job #{importJob.id.slice(-8)}</p>
              <p className="font-medium mt-1">{importJob.totalRecords} total records</p>
            </div>
            <span className={`badge text-xs px-3 py-1 rounded-full ${importJob.status === 'IMPORTED' ? 'bg-green-400/20 text-green-400' : importJob.status === 'PREVIEW_READY' ? 'bg-blue-400/20 text-blue-400' : importJob.status === 'FAILED' ? 'bg-red-400/20 text-red-400' : 'bg-silver/20 text-silver'}`}>{importJob.status}</span>
          </div>

          {/* Progress bar */}
          {progress && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-silver mb-1">
                <span>{progress.status}</span>
                <span>{progress.processedRows} / {progress.totalRows} ({progress.percent}%)</span>
              </div>
              <div className="h-3 bg-gunmetal/50 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${isFailed ? 'bg-red-400' : isCompleted ? 'bg-green-400' : 'bg-electric'}`} style={{ width: `${progress.percent}%` }} />
              </div>
              {isFailed && progress.error && <p className="text-red-400 text-xs mt-2">{progress.error}</p>}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-5 gap-3 text-center text-sm">
            <div><p className="font-bold">{importJob.totalRecords}</p><p className="text-xs text-silver">Total</p></div>
            <div><p className="font-bold text-green-400">{importJob.validRecords}</p><p className="text-xs text-silver">Valid</p></div>
            <div><p className="font-bold text-amber-400">{importJob.duplicateRecords}</p><p className="text-xs text-silver">Duplicates</p></div>
            <div><p className="font-bold text-purple-400">{importJob.conflictedRecords}</p><p className="text-xs text-silver">Conflicts</p></div>
            <div><p className="font-bold text-red-400">{importJob.errorRecords}</p><p className="text-xs text-silver">Errors</p></div>
          </div>
        </div>

        {/* Actions */}
        <div className="card-surface p-5 mb-6">
          <h3 className="font-semibold text-sm mb-3">Actions</h3>
          <div className="flex gap-3 flex-wrap">
            {!isRunning && importJob.status !== 'IMPORTED' && (
              <>
                <button onClick={() => handleRun('VALIDATE')} disabled={running} className="btn-secondary text-sm">Validate</button>
                <button onClick={() => handleRun('PREVIEW')} disabled={running} className="btn-secondary text-sm">Preview</button>
                <button onClick={() => handleRun('IMPORT')} disabled={running} className="btn-primary text-sm">Run Import</button>
              </>
            )}
            {isRunning && (
              <button onClick={handleCancel} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-colors">Cancel</button>
            )}
            {importJob.status === 'PREVIEW_READY' && (
              <button onClick={() => handleRun('IMPORT')} disabled={running} className="btn-primary text-sm">Confirm Import</button>
            )}
          </div>
        </div>

        {/* Queue job history */}
        {data.queueJobs?.length > 0 && (
          <div className="card-surface p-5">
            <h3 className="font-semibold text-sm mb-3">Job History</h3>
            <div className="space-y-2">
              {data.queueJobs.map((qj: any) => (
                <div key={qj.id} className="flex justify-between items-center text-xs py-2 border-b border-silver/10 last:border-0">
                  <div>
                    <span className="font-medium">{qj.jobType}</span>
                    <span className="text-silver ml-2">{qj.processedRows}/{qj.totalRows} rows</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge text-xs ${qj.status === 'COMPLETED' ? 'bg-green-400/20 text-green-400' : qj.status === 'FAILED' ? 'bg-red-400/20 text-red-400' : qj.status === 'RUNNING' ? 'bg-electric/20 text-electric' : 'bg-silver/20 text-silver'}`}>{qj.status}</span>
                    <span className="text-silver">{new Date(qj.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
