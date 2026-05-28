'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QRLabelsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [labels, setLabels] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch('/api/inventory?limit=200').then(r => r.ok ? r.json() : null),
      fetch('/api/inventory-groups').then(r => r.ok ? r.json() : null),
    ]).then(([invData, grpData]) => {
      if (invData) setItems(invData.items || []);
      if (grpData) setGroups(grpData.groups || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleItem = (id: string) => {
    const s = new Set(selectedItems);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedItems(s);
  };

  const toggleGroup = (id: string) => {
    const s = new Set(selectedGroups);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedGroups(s);
  };

  const generateLabels = async () => {
    setGenerating(true);
    const results: any[] = [];

    const itemIds = Array.from(selectedItems);
    const groupIds = Array.from(selectedGroups);

    for (let i = 0; i < itemIds.length; i++) {
      try {
        const r = await fetch(`/api/inventory/${itemIds[i]}/qr`);
        if (r.ok) { const d = await r.json(); results.push({ type: 'item', ...d }); }
      } catch {}
    }
    for (let i = 0; i < groupIds.length; i++) {
      try {
        const r = await fetch(`/api/inventory-groups/${groupIds[i]}/qr`);
        if (r.ok) { const d = await r.json(); results.push({ type: 'group', ...d }); }
      } catch {}
    }

    setLabels(results);
    setGenerating(false);
  };

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">QR Labels</h1>

        {labels.length === 0 ? (
          <>
            <p className="text-silver text-sm mb-4">Select items and groups to generate printable QR labels.</p>

            {items.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Inventory Items ({selectedItems.size} selected)</h2>
                <div className="max-h-48 overflow-y-auto card-surface p-3 space-y-1">
                  {items.map((item: any) => (
                    <label key={item.id} className="flex items-center gap-2 text-sm cursor-pointer py-1 hover:bg-silver/5 px-2 rounded">
                      <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => toggleItem(item.id)} />
                      <span>{item.card?.person?.displayName || 'Card'} — {item.card?.set?.name} #{item.card?.cardNumber}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {groups.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Groups ({selectedGroups.size} selected)</h2>
                <div className="max-h-48 overflow-y-auto card-surface p-3 space-y-1">
                  {groups.map((g: any) => (
                    <label key={g.id} className="flex items-center gap-2 text-sm cursor-pointer py-1 hover:bg-silver/5 px-2 rounded">
                      <input type="checkbox" checked={selectedGroups.has(g.id)} onChange={() => toggleGroup(g.id)} />
                      <span>{g.name} ({g.groupType.replace(/_/g, ' ')})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button onClick={generateLabels} disabled={generating || (selectedItems.size === 0 && selectedGroups.size === 0)} className="btn-primary disabled:opacity-50">
              {generating ? 'Generating...' : `Generate ${selectedItems.size + selectedGroups.size} Labels`}
            </button>
          </>
        ) : (
          <>
            <div className="flex gap-3 mb-6">
              <button onClick={() => window.print()} className="btn-primary">Print Labels</button>
              <button onClick={() => setLabels([])} className="btn-secondary">Back to Selection</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
              {labels.map((label, i) => (
                <div key={i} className="card-surface p-4 text-center print:border print:border-gray-300 print:shadow-none">
                  <img src={label.qrDataUrl} alt="QR" className="w-32 h-32 mx-auto mb-2" />
                  <p className="text-xs font-bold truncate">{label.label.name}</p>
                  <p className="text-[10px] text-silver truncate">{label.label.setName} {label.label.year && `(${label.label.year})`}</p>
                  {label.label.cardNumber && <p className="text-[10px] text-silver">#{label.label.cardNumber}</p>}
                  <p className="text-[9px] text-electric mt-1">Collectiverse</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
