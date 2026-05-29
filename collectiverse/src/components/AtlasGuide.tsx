'use client';

import Link from 'next/link';

interface AtlasGuideProps {
  title?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  variant?: 'INFO' | 'TIP' | 'WARNING' | 'EMPTY_STATE';
}

const variantStyles = {
  INFO: 'bg-electric/5 border-electric/20',
  TIP: 'bg-green-400/5 border-green-400/20',
  WARNING: 'bg-amber-400/5 border-amber-400/20',
  EMPTY_STATE: 'bg-gunmetal/30 border-silver/10',
};

export default function AtlasGuide({ title, message, actionLabel, actionHref, variant = 'TIP' }: AtlasGuideProps) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${variantStyles[variant]} mb-4`}>
      <img src="/brand/atlas/atlas-mascot.png" alt="Atlas" className="w-10 h-10 rounded-full flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-medium mb-0.5">{title}</p>}
        <p className="text-xs text-silver">{message}</p>
        {actionLabel && actionHref && (
          <Link href={actionHref} className="text-xs text-electric hover:underline mt-1 inline-block">{actionLabel} →</Link>
        )}
      </div>
    </div>
  );
}
