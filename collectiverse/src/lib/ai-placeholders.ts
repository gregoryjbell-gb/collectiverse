/**
 * AI Feature Placeholders
 * Architecture-ready stubs for future AI integrations.
 * These will be implemented when AI services are connected.
 */

export interface GradingPrediction {
  predictedGrade: string;
  confidence: number;
  factors: { centering: number; corners: number; edges: number; surface: number };
}

export interface CardSimilarity {
  cardId: string;
  score: number;
  reason: string;
}

export interface OCRResult {
  playerName: string;
  cardNumber: string;
  setName: string;
  year: number;
  confidence: number;
}

// Placeholder: AI Grading Prediction
export async function predictGrade(_imageUrl: string): Promise<GradingPrediction | null> {
  // Future: Send image to computer vision model for grading analysis
  return null;
}

// Placeholder: Card Similarity Engine
export async function findSimilarCards(_cardId: string): Promise<CardSimilarity[]> {
  // Future: Use embeddings/pgvector to find similar cards
  return [];
}

// Placeholder: OCR Recognition
export async function recognizeCard(_imageUrl: string): Promise<OCRResult | null> {
  // Future: Use OCR to extract card details from image
  return null;
}

// Placeholder: Recommendation Engine
export async function getRecommendations(_userId: string): Promise<string[]> {
  // Future: ML-based recommendations based on collection patterns
  return [];
}

// Placeholder: Price Prediction
export async function predictPrice(_cardId: string): Promise<number | null> {
  // Future: Time-series analysis for price prediction
  return null;
}
