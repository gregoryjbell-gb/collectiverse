import QRCode from 'qrcode';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export function getCardUrl(cardId: string) {
  return `${BASE_URL}/cards/${cardId}`;
}

export async function generateQRDataUrl(cardId: string): Promise<string> {
  const url = getCardUrl(cardId);
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: { dark: '#0B1F33', light: '#FFFFFF' },
  });
}

export async function generateQRBuffer(cardId: string): Promise<Buffer> {
  const url = getCardUrl(cardId);
  return QRCode.toBuffer(url, {
    width: 400,
    margin: 2,
    color: { dark: '#0B1F33', light: '#FFFFFF' },
  });
}
