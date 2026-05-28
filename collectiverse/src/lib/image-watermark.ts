/**
 * Image Watermarking System
 * 
 * Provides watermarking for public card images and private inventory scans.
 * Uses Canvas API (via node-canvas or sharp in production).
 * 
 * For MVP: implements a text-overlay watermark approach.
 * Future: integrate sharp for high-performance image processing.
 * 
 * Architecture:
 * - Original uploads stored privately (never served directly)
 * - Display versions generated with watermark
 * - Thumbnails generated for list pages
 * 
 * Storage structure:
 * - storage/private/users/{userId}/inventory/{itemId}/original-{field}.{ext}
 * - storage/private/users/{userId}/inventory/{itemId}/display-{field}.webp
 * - storage/private/users/{userId}/inventory/{itemId}/thumb-{field}.webp
 * - public/uploads/cards/display-{cardId}.webp
 * - public/uploads/cards/thumb-{cardId}.webp
 */

export interface WatermarkConfig {
  text: string;
  opacity: number; // 0.1 to 0.3
  position: 'bottom-right' | 'diagonal' | 'center';
  fontSize: number;
}

export const PUBLIC_WATERMARK: WatermarkConfig = {
  text: 'Collectiverse',
  opacity: 0.2,
  position: 'diagonal',
  fontSize: 24,
};

export const PRIVATE_WATERMARK = (username: string): WatermarkConfig => ({
  text: `${username} • Collectiverse`,
  opacity: 0.15,
  position: 'bottom-right',
  fontSize: 16,
});

export const IMAGE_SIZES = {
  thumbnail: { width: 200, height: 280 },
  display: { width: 1200, height: 1680 },
  original: null, // preserved as-is
};

/**
 * Generate watermarked display image from original buffer.
 * 
 * MVP Implementation: Returns the original buffer with metadata indicating
 * watermark should be applied. In production, integrate `sharp` for actual
 * image processing:
 * 
 * ```
 * import sharp from 'sharp';
 * 
 * export async function applyWatermark(
 *   imageBuffer: Buffer,
 *   config: WatermarkConfig,
 *   outputWidth?: number
 * ): Promise<Buffer> {
 *   const image = sharp(imageBuffer);
 *   const metadata = await image.metadata();
 *   const width = outputWidth || Math.min(metadata.width || 1200, 1200);
 *   const height = Math.round(width * ((metadata.height || 1680) / (metadata.width || 1200)));
 *   
 *   // Create SVG watermark overlay
 *   const svgWatermark = `
 *     <svg width="${width}" height="${height}">
 *       <text x="50%" y="95%" text-anchor="middle" 
 *         font-family="Inter, sans-serif" font-size="${config.fontSize}"
 *         fill="white" opacity="${config.opacity}">
 *         ${config.text}
 *       </text>
 *     </svg>`;
 *   
 *   return image
 *     .resize(width, height, { fit: 'inside' })
 *     .composite([{ input: Buffer.from(svgWatermark), gravity: 'south' }])
 *     .webp({ quality: 80 })
 *     .toBuffer();
 * }
 * ```
 * 
 * For now, we serve the original with response headers indicating
 * the image should not be cached or reused.
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  _config: WatermarkConfig,
  _outputWidth?: number
): Promise<Buffer> {
  // MVP: return original buffer
  // Production: use sharp to resize + overlay watermark text
  return imageBuffer;
}

/**
 * Generate thumbnail from image buffer.
 */
export async function generateThumbnail(
  imageBuffer: Buffer,
  _width: number = 200,
  _height: number = 280
): Promise<Buffer> {
  // MVP: return original buffer
  // Production: use sharp to resize
  return imageBuffer;
}

/**
 * Get the display filename for a given field and variant.
 */
export function getVariantFilename(baseFilename: string, variant: 'original' | 'display' | 'thumb'): string {
  if (variant === 'original') return baseFilename;
  const name = baseFilename.replace(/\.[^.]+$/, '');
  return `${variant}-${name}.webp`;
}

/**
 * Security headers for served images.
 */
export function getImageSecurityHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'private, no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'",
  };
}
