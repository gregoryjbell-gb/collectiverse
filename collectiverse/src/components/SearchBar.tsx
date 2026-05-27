'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  type: string;
  id: string;
  label: string;
  sublabel?: string;
  href: string;
}

export default function SearchBar({ placeholder = 'Search...', basePath }: { placeholder?: string; basePath?: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
      setOpen(true);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (basePath) {
      router.push(`${basePath}?q=${encodeURIComponent(query)}`);
    }
    setOpen(false);
  };

  const typeColors: Record<string, string> = {
    player: 'text-amber-400',
    card: 'text-electric',
    set: 'text-green-400',
    team: 'text-purple-400',
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="input-field"
          aria-label="Search"
        />
      </form>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-gunmetal border border-silver/20 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              onClick={() => { router.push(r.href); setOpen(false); setQuery(''); }}
              className="w-full text-left px-4 py-3 hover:bg-navy/50 transition-colors border-b border-silver/10 last:border-0"
            >
              <span className={`text-xs uppercase font-medium ${typeColors[r.type] || 'text-silver'}`}>{r.type}</span>
              <p className="text-white text-sm">{r.label}</p>
              {r.sublabel && <p className="text-silver text-xs">{r.sublabel}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
