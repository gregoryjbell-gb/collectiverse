'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ComicsPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (q?: string) => {
    setLoading(true);
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    fetch(`/api/comics${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setIssues(d.issues || []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(search); };

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Comics</h1>
          <Link href="/comics/series" className="btn-secondary text-sm">Browse Series</Link>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <input className="input-field flex-1" placeholder="Search comics by title, writer, artist..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn-primary text-sm">Search</button>
        </form>

        {loading ? <div className="text-silver text-center">Loading...</div> : issues.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">No Comics Found</h2>
            <p className="text-silver text-sm mb-4">Comic issues will appear here as they are added to the database.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue: any) => (
              <Link key={issue.id} href={`/comics/issues/${issue.id}`} className="card-surface p-4 hover:border-electric/30 transition-colors block">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{issue.comicSeries?.title || issue.title} #{issue.issueNumber}</p>
                    <p className="text-xs text-silver">{issue.comicSeries?.publisher || issue.publisher}{issue.writer ? ` • ${issue.writer}` : ''}{issue.coverDate ? ` • ${issue.coverDate}` : ''}</p>
                  </div>
                  <div className="flex gap-1">
                    {issue.keyIssue && <span className="badge bg-amber-400/20 text-amber-400 text-xs">Key</span>}
                    {issue.firstAppearance && <span className="badge bg-purple-400/20 text-purple-400 text-xs">1st App</span>}
                    {issue.variantCover && <span className="badge bg-electric/20 text-electric text-xs">Variant</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
