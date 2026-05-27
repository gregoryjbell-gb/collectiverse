'use client';

import { useState, useEffect } from 'react';

export default function QRCodeDisplay({ cardId }: { cardId: string }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/qr/${cardId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.qrDataUrl) setQrUrl(d.qrDataUrl); })
      .catch(() => {});
  }, [cardId]);

  return (
    <div className="card-surface p-5 mt-4 text-center">
      <h3 className="font-semibold mb-3">QR Identity</h3>
      {qrUrl ? (
        <img src={qrUrl} alt="QR Code" className="mx-auto rounded-lg" width={200} height={200} />
      ) : (
        <div className="text-silver text-sm py-4">Loading QR...</div>
      )}
      <p className="text-silver text-xs mt-2">Scan to access this card&apos;s digital profile</p>
    </div>
  );
}
