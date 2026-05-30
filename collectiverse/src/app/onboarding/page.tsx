'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OnboardingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/onboarding/status')
      .then(r => { if (r.status === 401) { router.push('/login'); return null; } return r.json(); })
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!data) return null;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <img src="/brand/atlas/atlas-mascot.png" alt="Atlas" className="w-16 h-16 mx-auto mb-3 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <h1 className="text-2xl font-bold">Welcome to Collectiverse</h1>
          <p className="text-silver mt-1">Complete these steps to get the most out of your collection.</p>
        </div>

        {/* Progress */}
        <div className="card-surface p-4 mb-6 text-center">
          <p className="text-3xl font-bold text-electric">{data.percent}%</p>
          <p className="text-xs text-silver">{data.completedCount} of {data.totalSteps} steps complete</p>
          <div className="h-3 bg-gunmetal/50 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-electric rounded-full transition-all" style={{ width: `${data.percent}%` }} />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {data.steps.map((step: any) => (
            <Link key={step.key} href={step.href} className={`card-surface p-4 flex items-center gap-3 transition-colors ${step.completed ? 'opacity-60' : 'hover:border-electric/30'}`}>
              <span className="text-xl">{step.completed ? '✅' : step.icon}</span>
              <div className="flex-1">
                <p className={`text-sm ${step.completed ? 'line-through text-silver' : 'font-medium'}`}>{step.label}</p>
                {step.completedAt && <p className="text-xs text-silver">Done {new Date(step.completedAt).toLocaleDateString()}</p>}
              </div>
              {!step.completed && <span className="text-electric text-xs">Go →</span>}
            </Link>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link href="/dashboard" className="btn-secondary text-sm">Back to Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
