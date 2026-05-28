import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const DISPLAY_WIDTH = 1200;
const THUMB_WIDTH = 300;
const WATERMARK_OPACITY = 0.25;

/**
 * Normalize any uploaded image to WebP format.
 */
export async function normalizeImage(fileBuffer: Buffer): Promise<Buffer> {
  return sharp(fileBuffer)
    .webp({ quality: 85 })
    .toBuffer();
}

/**
 * Create a watermarked display image (max 1200px wide).
 */
export async function createWatermarkedDisplayImage(buffer: Buffer, watermarkText: string): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata();
  const width = Math.min(metadata.width || DISPLAY_WIDTH, DISPLAY_WIDTH);
  const height = Math.round(width * ((metadata.height || 1680) / (metadata.width || 1200)));

  // Create SVG watermark with diagonal repeating text
  const svgWatermark = `
    <svg width="${width}" height="${height}">
      <defs>
        <pattern id="wm" patternUnits="userSpaceOnUse" width="300" height="200" patternTransform="rotate(-30)">
          <text x="10" y="100" font-family="Inter, Arial, sans-serif" font-size="20" fill="white" opacity="${WATERMARK_OPACITY}">${watermarkText}</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wm)"/>
      <text x="${width - 10}" y="${height - 15}" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="14" fill="white" opacity="0.4">${watermarkText}</text>
    </svg>`;

  return sharp(buffer)
    .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    .composite([{
      input: Buffer.from(svgWatermark),
      gravity: 'center',
    }])
    .webp({ quality: 80 })
    .toBuffer();
}

/**
 * Create a watermarked thumbnail (max 300px wide).
 */
export async function createWatermarkedThumbnail(buffer: Buffer, watermarkText: string): Promise<Buffer> {
  const metadata = await sharp(buffer).metadata();
  const width = Math.min(metadata.width || THUMB_WIDTH, THUMB_WIDTH);
  const height = Math.round(width * ((metadata.height || 420) / (metadata.width || 300)));

  const svgWatermark = `
    <svg width="${width}" height="${height}">
      <text x="${width - 5}" y="${height - 8}" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="10" fill="white" opacity="0.35">${watermarkText}</text>
    </svg>`;

  return sharp(buffer)
    .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    .composite([{
      input: Buffer.from(svgWatermark),
      gravity: 'southeast',
    }])
    .webp({ quality: 70 })
    .toBuffer();
}

/**
 * Save all image derivatives for an inventory item upload.
 * Returns the display filename (stored in DB).
 */
export async function saveInventoryImageDerivatives(opts: {
  userId: string;
  inventoryItemId: string;
  type: 'front' | 'back' | 'private';
  buffer: Buffer;
  watermarkText: string;
}): Promise<string> {
  const { userId, inventoryItemId, type, buffer, watermarkText } = opts;

  const dir = join(process.cwd(), 'storage', 'private', 'users', userId, 'inventory', inventoryItemId);
  await mkdir(dir, { recursive: true });

  // Normalize to webp
  const normalized = await normalizeImage(buffer);

  // Save original (never served)
  await writeFile(join(dir, `${type}-original.webp`), normalized);

  // Generate and save watermarked display
  const display = await createWatermarkedDisplayImage(normalized, watermarkText);
  await writeFile(join(dir, `${type}-display.webp`), display);

  // Generate and save watermarked thumbnail
  const thumb = await createWatermarkedThumbnail(normalized, watermarkText);
  await writeFile(join(dir, `${type}-thumb.webp`), thumb);

  // Return the display filename (what gets stored in DB)
  return `${type}-display.webp`;
}
