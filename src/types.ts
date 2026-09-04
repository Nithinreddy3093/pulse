/**
 * Pulse — Domain Types & Interfaces
 */

export type MarketFreshness = 'live' | 'delayed' | 'stale';

export type ChangeClassification = 'Normal' | 'Worth Watching' | 'Important' | 'Major Change';

export interface StockQuote {
  ticker: string;
  name: string;
  exchange: 'NASDAQ' | 'NYSE' | 'NSE' | 'BSE';
  currency: 'USD' | 'INR';
  price: number;
  previousClose: number;
  change: number;
  percentChange: number;
  volume: number;
  averageVolume: number;
  normalDailyRangePercent: number; // 0 if unavailable
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketCap?: string;
  sector: string;
  updatedAt: string;
  source: string;
  freshness: MarketFreshness;
  dataDiscrepancy?: string; // Flag if multiple providers diverge
}

export interface HistoricalStats {
  mean: number;
  stdDev: number;
  avgVolume: number;
  normalDailyRangePercent?: number;
  observations: number;
  fetchedAt: string;
  freshness: 'fresh' | 'stale' | 'unavailable';
  source: string;
  isAvailable: boolean;
}

export interface HistoricalPoint {
  timestamp: string;
  price: number;
  volume: number;
}

export interface StockHistory {
  ticker: string;
  range: '1D' | '1W' | '1M' | '3M';
  points: HistoricalPoint[];
}

export interface StockEvent {
  id: string;
  ticker: string;
  type: 'earnings' | 'guidance' | 'announcement' | 'dividend' | 'regulatory';
  title: string;
  description: string;
  impactScore: number; // 0 to 1
  timestamp: string;
}

export interface NewsArticle {
  id: string;
  ticker: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  relevance: number; // 0 to 1
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface SignalBreakdown {
  priceAbnormality: {
    score: number; // 0 - 25
    max: number; // 25
    value: number; // e.g. percent move
    normalBaseline: number; // expected normal range
    label: string;
    isAvailable?: boolean;
  };
  volumeAnomaly: {
    score: number; // 0 - 20
    max: number; // 20
    volumeMultiple: number; // e.g. 2.7x
    averageVolume?: number;
    label: string;
    isAvailable?: boolean;
  };
  historicalDeviation: {
    score: number; // 0 - 20
    max: number; // 20
    zScore: number; // standard deviations from mean
    historicalMeanPrice?: number;
    historicalStdDev?: number;
    label: string;
    isAvailable?: boolean;
  };
  newsActivity: {
    score: number; // 0 - 15
    max: number; // 15
    articleCount: number;
    velocityMultiple: number;
    label: string;
    isAvailable?: boolean;
  };
  companyEvents: {
    score: number; // 0 - 15
    max: number; // 15
    events: StockEvent[];
    label: string;
    isAvailable?: boolean;
  };
  marketContext: {
    score: number; // 0 - 5
    max: number; // 5
    marketChange: number; // S&P 500 or NIFTY change
    relativeDivergence: number; // difference
    label: string;
    isAvailable?: boolean;
  };
  provenance?: {
    volumeMultiple: number;
    averageVolume: number;
    historicalMeanPrice: number;
    historicalStdDev: number;
    historicalDeviationZScore: number;
    normalDailyRangePercent?: number;
    freshness: 'fresh' | 'stale' | 'unavailable';
    source: string;
    observations: number;
    isAvailable: boolean;
  };
}

export interface MeaningfulChangeResult {
  ticker: string;
  totalScore: number; // 0 - 100
  classification: ChangeClassification;
  isMeaningful: boolean; // totalScore >= 31
  signals: SignalBreakdown;
  summaryBullets: string[];
  timeline: {
    time: string;
    description: string;
    price?: number;
    isKeyMilestone?: boolean;
  }[];
  calculatedAt: string;
}

export interface StructuredAiEvidence {
  ticker: string;
  companyName: string;
  priceChange: number;
  currentPrice: number;
  lastSeenPrice: number;
  volumeMultiple: number;
  historicalDeviationZScore: number;
  normalVolatilityPercent: number;
  newsCount: number;
  marketChange: number;
  sectorName: string;
  events: string[];
  totalScore: number;
  classification: ChangeClassification;
}

export interface AiExplanationResponse {
  ticker: string;
  explanation: string;
  generatedAt: string;
  structuredEvidence: StructuredAiEvidence;
  modelUsed: string;
  isAiFallback: boolean;
  warningNotice?: string;
}

export interface UserStockState {
  ticker: string;
  lastSeenAt: string;
  lastSeenPrice: number;
  lastSeenVolume: number;
  lastSeenChangeScore: number;
  lastSeenNewsCount: number;
  lastSeenEventIds: string[];
}

export interface WatchlistItemWithChange {
  stock: StockQuote;
  userState?: UserStockState;
  changeResult: MeaningfulChangeResult;
  hasChangedSinceLastSeen: boolean;
  priceDeltaSinceLastSeen: number;
  percentDeltaSinceLastSeen: number;
}

export interface WatchlistSummary {
  totalTracked: number;
  majorChangesCount: number;
  worthWatchingCount: number;
  normalCount: number;
  lastCheckedAt: string | null;
  items: WatchlistItemWithChange[];
  allCaughtUp: boolean;
  isDemoActive: boolean;
}

export interface DemoScenario {
  id: 'nvda_surge' | 'tsla_dip' | 'quiet_market' | 'apple_earnings';
  name: string;
  description: string;
  badge: string;
}
