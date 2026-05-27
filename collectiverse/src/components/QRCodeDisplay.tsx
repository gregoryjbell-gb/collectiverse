'use client';

import { useState } from 'react';

export default function QRCodeDisplay({ cardId }: { cardId: string }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/qr/${cardId}`);
      if (res.ok) {
        const data = await res.json();
        setQrUrl(data.qrDataUrl);
      }
    } catch {
      // QR generation requires admin auth — show placeholder for public
    }
    setLoading(false);
  };

  return (
    <div className="card-surface p-5 mt-4 text-center">
      <h3 className="font-semibold mb-3">QR Identity</h3>
      {qrUrl ? (
        <img src={qrUrl} alt="QR Code" className="mx-auto rounded-lg" width={200} height={200} />
      ) : (
        <button onClick={generate} disabled={loading} className="btn-primary text-sm">
          {loading ? 'Generating...' : 'Generate QR Code'}
        </button>
      )}
      <p className="text-silver text-xs mt-2">Scan to access this card&apos;s digital profile</p>
    </div>
  );
}
