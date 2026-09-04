import { 
  CHANGE_ENGINE_WEIGHTS, 
  getClassification 
} from '../../src/config/changeEngineConfig';
import type { 
  StockQuote, 
  UserStockState, 
  StockEvent, 
  NewsArticle, 
  MeaningfulChangeResult, 
  SignalBreakdown,
  HistoricalStats
} from '../../src/types';

export interface ChangeEngineInput {
  stock: StockQuote;
  userState?: UserStockState;
  historicalStats?: HistoricalStats;
  // Compatibility fields for unit tests and simple callers:
  historicalMeanPrice?: number;
  historicalStdDev?: number;
  historicalAverageVolume?: number;
  news: NewsArticle[];
  events: StockEvent[];
  marketIndexChange: number; // e.g. S&P 500 % change
}

/**
 * Deterministic Meaningful Change Engine
 * Evaluates market shifts against stock-specific historical baselines
 * and the user's personal last-seen state.
 */
export function calculateMeaningfulChange(input: ChangeEngineInput): MeaningfulChangeResult {
  const { stock, userState, historicalStats, news, events, marketIndexChange } = input;

  // Determine historical baseline metrics and provenance
  const hasProvidedStats = historicalStats && historicalStats.isAvailable && historicalStats.observations > 0;
  const hasCompatStats = !historicalStats && (input.historicalMeanPrice !== undefined && input.historicalStdDev !== undefined);

  let effectiveAvgVol = 0;
  let effectiveMean = 0;
  let effectiveStdDev = 0;
  let effectiveNormalVol = 0;
  let isHistAvailable = false;
  let histFreshness: 'fresh' | 'stale' | 'unavailable' = 'unavailable';
  let histSource = 'Historical baseline unavailable';
  let histObservations = 0;

  if (hasProvidedStats) {
    effectiveAvgVol = historicalStats.avgVolume;
    effectiveMean = historicalStats.mean;
    effectiveStdDev = historicalStats.stdDev;
    effectiveNormalVol = historicalStats.normalDailyRangePercent || (stock.normalDailyRangePercent > 0 ? stock.normalDailyRangePercent : 0);
    isHistAvailable = true;
    histFreshness = historicalStats.freshness;
    histSource = historicalStats.source;
    histObservations = historicalStats.observations;
  } else if (hasCompatStats) {
    effectiveAvgVol = input.historicalAverageVolume || stock.averageVolume || 1_000_000;
    effectiveMean = input.historicalMeanPrice!;
    effectiveStdDev = input.historicalStdDev!;
    effectiveNormalVol = stock.normalDailyRangePercent > 0 ? stock.normalDailyRangePercent : 2.0;
    isHistAvailable = true;
    histFreshness = 'fresh';
    histSource = 'Explicit Test Parameters';
    histObservations = 30;
  } else {
    // Real mode with missing / rate-limited historical stats:
    // DO NOT FABRICATE SYNTHETIC DATA
    effectiveAvgVol = 0;
    effectiveMean = 0;
    effectiveStdDev = 0;
    effectiveNormalVol = stock.normalDailyRangePercent > 0 ? stock.normalDailyRangePercent : 0;
    isHistAvailable = false;
    histFreshness = historicalStats?.freshness || 'unavailable';
    histSource = historicalStats?.source || 'Alpha Vantage (Historical Data Unavailable)';
    histObservations = 0;
  }

  // 1. Price Abnormality (Weight: 25%)
  // Compare the current move (or the move since user last checked)
  // to the stock's normal daily range.
  let priceDeltaPercent = Math.abs(stock.percentChange);
  if (userState && userState.lastSeenPrice > 0) {
    const deltaFromLastSeen = Math.abs((stock.price - userState.lastSeenPrice) / userState.lastSeenPrice) * 100;
    priceDeltaPercent = Math.max(priceDeltaPercent, deltaFromLastSeen);
  }

  const normalVol = effectiveNormalVol > 0 ? effectiveNormalVol : 2.0;
  const priceMoveRatio = priceDeltaPercent / normalVol;

  let priceScore = Math.min(
    CHANGE_ENGINE_WEIGHTS.priceAbnormality,
    Math.round(Math.min(priceMoveRatio / 3.0, 1.0) * CHANGE_ENGINE_WEIGHTS.priceAbnormality)
  );
  if (priceMoveRatio >= 2.5 && priceScore < 22) priceScore = 23;

  const priceLabel = effectiveNormalVol > 0
    ? `${priceMoveRatio.toFixed(1)}× normal range (±${effectiveNormalVol.toFixed(1)}% 30-day avg)`
    : `${priceDeltaPercent.toFixed(2)}% net price change (volatility baseline pending)`;

  // 2. Volume Anomaly (Weight: 20%)
  // Trading volume relative to 30-day average volume
  let volumeMultiple = 0;
  let volumeScore = 0;
  let volumeLabel = '';
  let isVolumeAvailable = false;

  if (isHistAvailable && effectiveAvgVol > 0) {
    volumeMultiple = Number((stock.volume / effectiveAvgVol).toFixed(2));
    isVolumeAvailable = true;
    if (volumeMultiple <= 0.8) {
      volumeScore = 2;
    } else if (volumeMultiple <= 1.2) {
      volumeScore = 6;
    } else if (volumeMultiple <= 1.8) {
      volumeScore = 12;
    } else if (volumeMultiple <= 2.5) {
      volumeScore = 16;
    } else {
      volumeScore = Math.min(CHANGE_ENGINE_WEIGHTS.volumeAnomaly, Math.round(16 + (volumeMultiple - 2.5) * 2));
    }
    volumeLabel = `${volumeMultiple}× 30-day avg volume (${Math.round(effectiveAvgVol).toLocaleString()}/day)`;
  } else {
    volumeMultiple = 0;
    volumeScore = 0;
    isVolumeAvailable = false;
    volumeLabel = `Historical volume baseline unavailable (${stock.volume.toLocaleString()} shares traded today)`;
  }

  // 3. Historical Deviation / Z-Score (Weight: 20%)
  // How far is the current price from the historical mean in units of standard deviations
  let zScore = 0;
  let histScore = 0;
  let histLabel = '';
  let isHistDevAvailable = false;

  if (isHistAvailable && effectiveStdDev > 0 && effectiveMean > 0) {
    const safeStdDev = Math.max(effectiveStdDev, 0.01);
    zScore = Number((Math.abs(stock.price - effectiveMean) / safeStdDev).toFixed(2));
    isHistDevAvailable = true;
    if (zScore < 1.0) {
      histScore = Math.round(zScore * 6);
    } else if (zScore < 2.0) {
      histScore = 7 + Math.round((zScore - 1.0) * 7);
    } else if (zScore < 3.0) {
      histScore = 15 + Math.round((zScore - 2.0) * 3);
    } else {
      histScore = CHANGE_ENGINE_WEIGHTS.historicalDeviation;
    }
    histLabel = `${zScore}σ from 30-day mean ($${effectiveMean.toFixed(2)} ± $${effectiveStdDev.toFixed(2)})`;
  } else {
    zScore = 0;
    histScore = 0;
    isHistDevAvailable = false;
    histLabel = 'Historical price distribution unavailable';
  }

  // 4. News Activity (Weight: 15%)
  const relevantNews = news.filter((n) => n.relevance >= 0.6);
  const articleCount = relevantNews.length;
  let newsScore = 0;
  if (articleCount === 0) {
    newsScore = 1;
  } else if (articleCount <= 2) {
    newsScore = 6;
  } else if (articleCount <= 4) {
    newsScore = 11;
  } else {
    newsScore = CHANGE_ENGINE_WEIGHTS.newsActivity;
  }

  // 5. Company Events (Weight: 15%)
  let eventScore = 0;
  if (events.length > 0) {
    const maxImpact = Math.max(...events.map((e) => e.impactScore));
    eventScore = Math.min(CHANGE_ENGINE_WEIGHTS.companyEvents, Math.round(maxImpact * CHANGE_ENGINE_WEIGHTS.companyEvents));
  }

  // 6. Market Context (Weight: 5%)
  const relativeDivergence = Number(Math.abs(stock.percentChange - marketIndexChange).toFixed(2));
  let marketScore = 0;
  if (relativeDivergence >= 4.0) {
    marketScore = 5;
  } else if (relativeDivergence >= 2.0) {
    marketScore = 4;
  } else if (relativeDivergence >= 1.0) {
    marketScore = 2;
  } else {
    marketScore = 1;
  }

  // Total Deterministic Score
  const totalScore = Math.min(100, Math.max(0, priceScore + volumeScore + histScore + newsScore + eventScore + marketScore));
  const classification = getClassification(totalScore);
  const isMeaningful = totalScore > 30;

  // Key summary bullets explaining the signals
  const summaryBullets: string[] = [];
  if (priceMoveRatio >= 2.0) {
    summaryBullets.push(`Unusual price velocity (${priceMoveRatio.toFixed(1)}× historical daily volatility)`);
  } else if (priceDeltaPercent >= 2.0) {
    summaryBullets.push(`Moderate price movement of ${stock.percentChange >= 0 ? '+' : ''}${stock.percentChange.toFixed(2)}%`);
  }

  if (isVolumeAvailable && volumeMultiple >= 1.8) {
    summaryBullets.push(`${volumeMultiple}× higher trading volume than 30-day baseline`);
  }

  if (isHistDevAvailable && zScore >= 2.0) {
    summaryBullets.push(`Price is ${zScore}σ away from normal 30-day historical mean`);
  }

  if (events.length > 0) {
    summaryBullets.push(`Key corporate event: ${events[0].title}`);
  }

  if (articleCount >= 3) {
    summaryBullets.push(`High news velocity (${articleCount} material updates detected)`);
  }

  if (relativeDivergence >= 2.5) {
    summaryBullets.push(`Diverged significantly from broader market (Index: ${marketIndexChange >= 0 ? '+' : ''}${marketIndexChange.toFixed(2)}%)`);
  }

  if (summaryBullets.length === 0) {
    summaryBullets.push('Trading within normal statistical parameters and historical volatility.');
  }

  // Timeline reconstructing the progression since user last checked
  const timeline: MeaningfulChangeResult['timeline'] = [];
  
  if (userState && userState.lastSeenAt) {
    const formattedDate = new Date(userState.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timeline.push({
      time: formattedDate,
      description: `You last checked this stock at $${userState.lastSeenPrice.toFixed(2)}`,
      price: userState.lastSeenPrice,
      isKeyMilestone: true,
    });
  } else {
    timeline.push({
      time: 'Market Open',
      description: `Baseline previous close $${stock.previousClose.toFixed(2)}`,
      price: stock.previousClose,
    });
  }

  if (isVolumeAvailable && volumeMultiple >= 1.8) {
    timeline.push({
      time: 'Mid-Session',
      description: `Trading volume surged to ${volumeMultiple}× normal 30-day pace`,
    });
  }

  if (articleCount > 0 && news[0]) {
    timeline.push({
      time: 'News Alert',
      description: `Coverage spike: "${news[0].title.slice(0, 55)}..."`,
    });
  }

  if (events.length > 0) {
    timeline.push({
      time: 'Company Event',
      description: `${events[0].title}: ${events[0].description.slice(0, 60)}...`,
      isKeyMilestone: true,
    });
  }

  if (isHistDevAvailable && zScore >= 2.0) {
    timeline.push({
      time: 'Statistical Deviation',
      description: `Price crossed ${zScore}σ threshold outside normal distribution`,
    });
  }

  timeline.push({
    time: 'Current',
    description: `Current quote at $${stock.price.toFixed(2)} (${stock.percentChange >= 0 ? '+' : ''}${stock.percentChange.toFixed(2)}%)`,
    price: stock.price,
    isKeyMilestone: true,
  });

  const breakdown: SignalBreakdown = {
    priceAbnormality: {
      score: priceScore,
      max: CHANGE_ENGINE_WEIGHTS.priceAbnormality,
      value: priceDeltaPercent,
      normalBaseline: effectiveNormalVol,
      label: priceLabel,
      isAvailable: effectiveNormalVol > 0,
    },
    volumeAnomaly: {
      score: volumeScore,
      max: CHANGE_ENGINE_WEIGHTS.volumeAnomaly,
      volumeMultiple,
      averageVolume: effectiveAvgVol,
      label: volumeLabel,
      isAvailable: isVolumeAvailable,
    },
    historicalDeviation: {
      score: histScore,
      max: CHANGE_ENGINE_WEIGHTS.historicalDeviation,
      zScore,
      historicalMeanPrice: effectiveMean,
      historicalStdDev: effectiveStdDev,
      label: histLabel,
      isAvailable: isHistDevAvailable,
    },
    newsActivity: {
      score: newsScore,
      max: CHANGE_ENGINE_WEIGHTS.newsActivity,
      articleCount,
      velocityMultiple: Number((articleCount / 1.5).toFixed(1)),
      label: `${articleCount} high-relevance articles`,
      isAvailable: true,
    },
    companyEvents: {
      score: eventScore,
      max: CHANGE_ENGINE_WEIGHTS.companyEvents,
      events,
      label: events.length > 0 ? events.map((e) => e.title).join(', ') : 'No major filings',
      isAvailable: true,
    },
    marketContext: {
      score: marketScore,
      max: CHANGE_ENGINE_WEIGHTS.marketContext,
      marketChange: marketIndexChange,
      relativeDivergence,
      label: `${relativeDivergence > 0 ? '+' : ''}${relativeDivergence.toFixed(2)}% vs index (${marketIndexChange >= 0 ? '+' : ''}${marketIndexChange.toFixed(2)}%)`,
      isAvailable: true,
    },
    provenance: {
      volumeMultiple,
      averageVolume: effectiveAvgVol,
      historicalMeanPrice: effectiveMean,
      historicalStdDev: effectiveStdDev,
      historicalDeviationZScore: zScore,
      normalDailyRangePercent: effectiveNormalVol,
      freshness: histFreshness,
      source: histSource,
      observations: histObservations,
      isAvailable: isHistAvailable,
    },
  };

  return {
    ticker: stock.ticker,
    totalScore,
    classification,
    isMeaningful,
    signals: breakdown,
    summaryBullets,
    timeline,
    calculatedAt: new Date().toISOString(),
  };
}
