/**
 * Pulse Change Engine Configuration
 * Single source of truth for weights and classification thresholds
 */

export const CHANGE_ENGINE_WEIGHTS = {
  priceAbnormality: 25,
  volumeAnomaly: 20,
  historicalDeviation: 20,
  newsActivity: 15,
  companyEvents: 15,
  marketContext: 5,
} as const;

export const CHANGE_CLASSIFICATION_THRESHOLDS = {
  normalMax: 30,
  worthWatchingMax: 55,
  importantMax: 75,
  majorChangeMax: 100,
} as const;

export function getClassification(score: number): 'Normal' | 'Worth Watching' | 'Important' | 'Major Change' {
  if (score <= CHANGE_CLASSIFICATION_THRESHOLDS.normalMax) return 'Normal';
  if (score <= CHANGE_CLASSIFICATION_THRESHOLDS.worthWatchingMax) return 'Worth Watching';
  if (score <= CHANGE_CLASSIFICATION_THRESHOLDS.importantMax) return 'Important';
  return 'Major Change';
}

export function getClassificationBadgeClasses(classification: string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (classification) {
    case 'Major Change':
    case 'Major change':
      return {
        bg: 'bg-[#FEF2F2]',
        text: 'text-[#DC2626]',
        border: 'border-red-200',
        dot: 'bg-[#DC2626]',
      };
    case 'Important':
      return {
        bg: 'bg-[#FFF7ED]',
        text: 'text-[#EA580C]',
        border: 'border-orange-200',
        dot: 'bg-[#EA580C]',
      };
    case 'Worth Watching':
    case 'Worth watching':
      return {
        bg: 'bg-[#FFFBEB]',
        text: 'text-[#D97706]',
        border: 'border-amber-200',
        dot: 'bg-[#D97706]',
      };
    case 'No significant change':
    case 'Normal':
    default:
      return {
        bg: 'bg-[#ECFDF5]',
        text: 'text-[#059669]',
        border: 'border-emerald-200',
        dot: 'bg-[#10B981]',
      };
  }
}
