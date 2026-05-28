import QRCode from 'qrcode';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export function getCardUrl(cardId: string) {
  return `${BASE_URL}/cards/${cardId}`;
}

export function getPassportItemUrl(publicId: string) {
  return `${BASE_URL}/passport/item/${publicId}`;
}

export function getPassportGroupUrl(publicId: string) {
  return `${BASE_URL}/passport/group/${publicId}`;
}

export async function generateQRDataUrl(idOrUrl: string): Promise<string> {
  // If it looks like a full URL, use it directly; otherwise build card URL
  const url = idOrUrl.startsWith('http') ? idOrUrl : getCardUrl(idOrUrl);
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: { dark: '#0B1F33', light: '#FFFFFF' },
  });
}

export async function generateQRForPassportItem(publicId: string): Promise<string> {
  return QRCode.toDataURL(getPassportItemUrl(publicId), {
    width: 400,
    margin: 2,
    color: { dark: '#0B1F33', light: '#FFFFFF' },
  });
}

export async function generateQRForPassportGroup(publicId: string): Promise<string> {
  return QRCode.toDataURL(getPassportGroupUrl(publicId), {
    width: 400,
    margin: 2,
    color: { dark: '#0B1F33', light: '#FFFFFF' },
  });
}

export async function generateQRBuffer(idOrUrl: string): Promise<Buffer> {
  const url = idOrUrl.startsWith('http') ? idOrUrl : getCardUrl(idOrUrl);
  return QRCode.toBuffer(url, {
    width: 400,
    margin: 2,
    color: { dark: '#0B1F33', light: '#FFFFFF' },
  });
}
