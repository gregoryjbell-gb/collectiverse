'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function InventoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/inventory/${id}`)
      .then((r) => {
        if (r.status === 401) { router.push('/login'); return null; }
        if (!r.ok) { router.push('/inventory'); return null; }
        return r.json();
      })
      .then((d) => { if (d) setItem(d.item); })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <main className="min-h-screen py-12 px-6"><div className="text-silver text-center">Loading...</div></main>;
  if (!item) return null;

  const card = item.card;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/inventory" className="text-silver hover:text-white text-sm mb-6 inline-block">&larr; Back to Inventory</Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Card info */}
          <div>
            <div className="card-surface p-6">
              <h2 className="text-sm text-silver uppercase tracking-wide mb-2">Public Card</h2>
              <h1 className="text-2xl font-bold mb-1">{card.person?.displayName || 'Unknown'}</h1>
              <p className="text-silver">{card.set?.name} #{card.cardNumber} {card.year && `(${card.year})`}</p>
              {card.team && <p className="text-silver text-sm">{card.team.name}</p>}
              <Link href={`/cards/${card.id}`} className="text-electric text-sm hover:underline mt-3 inline-block">View public card page &rarr;</Link>
            </div>

            {/* Private scans */}
            {(item.frontScanUrl || item.backScanUrl || item.privateImageUrl) && (
              <div className="card-surface p-6 mt-4">
                <h3 className="font-semibold mb-3">Private Scans</h3>
                <div className="grid grid-cols-2 gap-3">
                  {item.frontScanUrl && <img src={item.frontScanUrl} alt="Front scan" className="rounded-lg" />}
                  {item.backScanUrl && <img src={item.backScanUrl} alt="Back scan" className="rounded-lg" />}
                  {item.privateImageUrl && <img src={item.privateImageUrl} alt="Private image" className="rounded-lg" />}
                </div>
              </div>
            )}
          </div>

          {/* Right: Inventory details */}
          <div className="space-y-4">
            <div className="card-surface p-6">
              <h3 className="font-semibold mb-4">My Copy Details</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <dt className="text-silver">Status</dt>
                <dd><span className={`badge ${item.status === 'FOR_SALE' ? 'bg-green-500/20 text-green-400' : 'bg-silver/10 text-silver'}`}>{item.status}</span></dd>
                <dt className="text-silver">Quantity</dt>
                <dd>{item.quantity}</dd>
                <dt className="text-silver">Condition</dt>
                <dd>{item.condition || 'Raw'}</dd>
                {item.gradeCompany && <><dt className="text-silver">Grading Co.</dt><dd>{item.gradeCompany}</dd></>}
                {item.gradeValue && <><dt className="text-silver">Grade</dt><dd className="text-electric font-bold">{item.gradeValue}</dd></>}
                {item.certNumber && <><dt className="text-silver">Cert #</dt><dd>{item.certNumber}</dd></>}
              </dl>
            </div>

            <div className="card-surface p-6">
              <h3 className="font-semibold mb-4">Financials</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {item.purchasePrice != null && <><dt className="text-silver">Purchase Price</dt><dd>${item.purchasePrice.toLocaleString()}</dd></>}
                {item.estimatedValue != null && <><dt className="text-silver">Estimated Value</dt><dd className="text-electric font-bold">${item.estimatedValue.toLocaleString()}</dd></>}
                {item.askingPrice != null && <><dt className="text-silver">Asking Price</dt><dd>${item.askingPrice.toLocaleString()}</dd></>}
                {item.acquisitionDate && <><dt className="text-silver">Acquired</dt><dd>{new Date(item.acquisitionDate).toLocaleDateString()}</dd></>}
              </dl>
            </div>

            {item.storageLocation && (
              <div className="card-surface p-6">
                <h3 className="font-semibold mb-2">Storage</h3>
                <p className="text-silver">{item.storageLocation}</p>
              </div>
            )}

            {item.notes && (
              <div className="card-surface p-6">
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-silver text-sm">{item.notes}</p>
              </div>
            )}

            {/* Transaction History */}
            {item.transactions?.length > 0 && (
              <div className="card-surface p-6">
                <h3 className="font-semibold mb-3">Transaction History</h3>
                <div className="space-y-2">
                  {item.transactions.map((t: any) => (
                    <div key={t.id} className="flex justify-between items-center py-2 border-b border-silver/10 last:border-0 text-sm">
                      <div>
                        <span className="badge bg-silver/10 text-silver text-xs">{t.type}</span>
                        {t.marketplace && <span className="text-silver ml-2">{t.marketplace}</span>}
                      </div>
                      <div className="text-right">
                        {t.amount && <span className="text-electric font-medium">${t.amount.toLocaleString()}</span>}
                        {t.transactionDate && <p className="text-xs text-silver">{new Date(t.transactionDate).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Link href={`/inventory/${item.id}/edit`} className="btn-primary">Edit</Link>
              <button onClick={() => { if (confirm('Delete?')) { fetch(`/api/inventory/${item.id}`, { method: 'DELETE' }).then(() => router.push('/inventory')); } }} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
