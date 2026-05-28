import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * POST /api/cards/identify
 * Accepts a card image upload and returns suggested card details.
 * 
 * Currently uses heuristic/placeholder logic.
 * Future: integrate with AI vision API (OpenAI, Google Vision, custom model).
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('image');

  if (!file || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'image file is required' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 400 });
  }

  // Store the uploaded image temporarily for reuse as frontScan
  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const filename = `${randomUUID()}.${ext}`;
  const dir = join(process.cwd(), 'public', 'uploads', 'intake');
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filepath = join(dir, filename);
  await writeFile(filepath, buffer);

  const imageUrl = `/uploads/intake/${filename}`;

  // --- AI IDENTIFICATION PLACEHOLDER ---
  // In production, this would send the image to a vision AI service
  // (OpenAI GPT-4V, Google Cloud Vision, custom trained model)
  // and return structured card data.
  //
  // For now, return empty suggestions with the stored image URL
  // so the user can manually fill in details.
  // The confidence score indicates this is a placeholder.

  const suggestion = {
    playerName: '',
    sportName: '',
    year: '',
    setName: '',
    manufacturer: '',
    cardNumber: '',
    teamName: '',
    rookie: false,
    parallel: '',
    confidence: 0,
    imageUrl,
    message: 'AI card identification is not yet connected. Please fill in the card details manually. Your uploaded image has been saved and can be used as the front scan.',
  };

  return NextResponse.json({ suggestion });
}
