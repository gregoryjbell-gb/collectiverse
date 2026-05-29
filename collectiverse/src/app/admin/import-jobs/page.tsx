'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ImportJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/import-jobs')
      .then(r => { if (r.status === 403) { router.push('/admin'); return null; } return r.json(); })
      .then(d => { if (d) setJobs(d.jobs || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Import Jobs</h1>
          <div className="flex gap-2">
            <Link href="/admin/import-connectors" className="btn-secondary text-sm">Connectors</Link>
            <Link href="/admin" className="text-sm text-silver hover:text-electric">← Admin</Link>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <p className="text-silver">No import jobs yet. Create a connector and run an import.</p>
            <Link href="/admin/import-connectors" className="btn-primary text-sm mt-3 inline-block">Go to Connectors</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job: any) => (
              <div key={job.id} className="card-surface p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{job.connector?.name || 'Unknown'} <span className="text-silver text-xs">({job.connector?.connectorType})</span></p>
                    <p className="text-xs text-silver">{job.totalRecords} records • {job.validRecords} valid • {job.duplicateRecords} dupes • {new Date(job.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`badge text-xs ${job.status === 'IMPORTED' ? 'bg-green-400/20 text-green-400' : job.status === 'PREVIEW_READY' ? 'bg-blue-400/20 text-blue-400' : job.status === 'FAILED' ? 'bg-red-400/20 text-red-400' : 'bg-silver/20 text-silver'}`}>{job.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
