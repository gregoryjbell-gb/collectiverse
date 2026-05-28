import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const DISPLAY_WIDTH = 1200;
const THUMB_WIDTH = 300;
const WATERMARK_TEXT = 'Collectiverse Reference';
const WATERMARK_OPACITY = 0.2;

/**
 * Save all public card image derivatives.
 * Generates: original, watermarked display, watermarked thumbnail.
 * Returns the display URL path.
 */
export async function saveCardImageDerivatives(opts: {
  cardId: string;
  type: 'front' | 'back';
  buffer: Buffer;
}): Promise<{ displayUrl: string; thumbUrl: string }> {
  const { cardId, type, buffer } = opts;

  const dir = join(process.cwd(), 'public', 'uploads', 'cards', cardId);
  await mkdir(dir, { recursive: true });

  // Normalize to webp
  const normalized = await sharp(buffer).webp({ quality: 85 }).toBuffer();

  // Save original (admin-only, not linked publicly)
  await writeFile(join(dir, `${type}-original.webp`), normalized);

  // Generate watermarked display
  const metadata = await sharp(normalized).metadata();
  const width = Math.min(metadata.width || DISPLAY_WIDTH, DISPLAY_WIDTH);
  const height = Math.round(width * ((metadata.height || 1680) / (metadata.width || 1200)));

  const displaySvg = `
    <svg width="${width}" height="${height}">
      <defs>
        <pattern id="wm" patternUnits="userSpaceOnUse" width="350" height="200" patternTransform="rotate(-30)">
          <text x="10" y="100" font-family="Inter, Arial, sans-serif" font-size="18" fill="white" opacity="${WATERMARK_OPACITY}">${WATERMARK_TEXT}</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wm)"/>
      <text x="${width - 10}" y="${height - 12}" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="13" fill="white" opacity="0.35">${WATERMARK_TEXT}</text>
    </svg>`;

  const display = await sharp(normalized)
    .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    .composite([{ input: Buffer.from(displaySvg), gravity: 'center' }])
    .webp({ quality: 80 })
    .toBuffer();

  await writeFile(join(dir, `${type}-display.webp`), display);

  // Generate watermarked thumbnail
  const thumbWidth = Math.min(metadata.width || THUMB_WIDTH, THUMB_WIDTH);
  const thumbHeight = Math.round(thumbWidth * ((metadata.height || 420) / (metadata.width || 300)));

  const thumbSvg = `
    <svg width="${thumbWidth}" height="${thumbHeight}">
      <text x="${thumbWidth - 5}" y="${thumbHeight - 6}" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="9" fill="white" opacity="0.3">Collectiverse</text>
    </svg>`;

  const thumb = await sharp(normalized)
    .resize(thumbWidth, thumbHeight, { fit: 'inside', withoutEnlargement: true })
    .composite([{ input: Buffer.from(thumbSvg), gravity: 'southeast' }])
    .webp({ quality: 70 })
    .toBuffer();

  await writeFile(join(dir, `${type}-thumb.webp`), thumb);

  const displayUrl = `/uploads/cards/${cardId}/${type}-display.webp`;
  const thumbUrl = `/uploads/cards/${cardId}/${type}-thumb.webp`;

  return { displayUrl, thumbUrl };
}
