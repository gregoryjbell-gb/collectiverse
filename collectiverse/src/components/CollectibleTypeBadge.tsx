'use client';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  SPORTS_CARD: { label: 'Sports Card', color: 'bg-blue-400/20 text-blue-400', icon: '🏈' },
  TCG_CARD: { label: 'TCG Card', color: 'bg-purple-400/20 text-purple-400', icon: '🎴' },
  NON_SPORTS_CARD: { label: 'Non-Sports', color: 'bg-pink-400/20 text-pink-400', icon: '🎬' },
  COMIC_BOOK: { label: 'Comic Book', color: 'bg-amber-400/20 text-amber-400', icon: '📚' },
  SEALED_PRODUCT: { label: 'Sealed', color: 'bg-green-400/20 text-green-400', icon: '📦' },
  MEMORABILIA: { label: 'Memorabilia', color: 'bg-red-400/20 text-red-400', icon: '🏆' },
  TICKET: { label: 'Ticket', color: 'bg-cyan-400/20 text-cyan-400', icon: '🎫' },
  COIN: { label: 'Coin', color: 'bg-yellow-400/20 text-yellow-400', icon: '🪙' },
  VIDEO_GAME: { label: 'Video Game', color: 'bg-indigo-400/20 text-indigo-400', icon: '🎮' },
  OTHER: { label: 'Other', color: 'bg-silver/20 text-silver', icon: '📋' },
};

export function CollectibleTypeBadge({ type, size = 'sm' }: { type: string; size?: 'xs' | 'sm' }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.OTHER;
  return (
    <span className={`badge ${config.color} ${size === 'xs' ? 'text-xs' : 'text-xs'} inline-flex items-center gap-1`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

export function getTypeLabel(type: string): string {
  return TYPE_CONFIG[type]?.label || 'Other';
}

export function getTypeIcon(type: string): string {
  return TYPE_CONFIG[type]?.icon || '📋';
}

export const COLLECTIBLE_TYPES = Object.entries(TYPE_CONFIG).map(([value, { label }]) => ({ value, label }));
