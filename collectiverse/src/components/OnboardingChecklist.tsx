'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OnboardingChecklist() {
  const [data, setData] = useState<any>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    fetch('/api/onboarding/status').then(r => r.ok ? r.json() : null).then(d => { if (d) setData(d); });
  }, []);

  if (!data || data.dismissed || data.percent === 100 || hidden) return null;

  const handleDismiss = async () => {
    await fetch('/api/onboarding/dismiss', { method: 'POST' });
    setHidden(true);
  };

  return (
    <div className="card-surface p-5 mb-6 border-electric/20 border">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <img src="/brand/atlas/atlas-mascot.png" alt="Atlas" className="w-8 h-8 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div>
            <p className="text-sm font-medium">Getting Started</p>
            <p className="text-xs text-silver">{data.completedCount}/{data.totalSteps} complete</p>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-xs text-silver hover:text-white">Dismiss</button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gunmetal/50 rounded-full mb-3 overflow-hidden">
        <div className="h-full bg-electric rounded-full transition-all" style={{ width: `${data.percent}%` }} />
      </div>

      <div className="space-y-1.5">
        {data.steps.filter((s: any) => !s.completed).slice(0, 4).map((step: any) => (
          <Link key={step.key} href={step.href} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-silver/5 transition-colors">
            <span className="text-sm">{step.icon}</span>
            <span className="text-xs text-silver">{step.label}</span>
            <span className="text-xs text-electric ml-auto">→</span>
          </Link>
        ))}
      </div>

      {data.totalSteps - data.completedCount > 4 && (
        <Link href="/onboarding" className="text-xs text-electric hover:underline mt-2 inline-block">View all steps →</Link>
      )}
    </div>
  );
}
