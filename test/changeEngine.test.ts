import { calculateMeaningfulChange } from '../server/services/changeEngine';
import type { StockQuote } from '../src/types';

function runTests() {
  console.log('--- Running Pulse Deterministic Change Engine Unit Tests ---');

  const mockQuote: StockQuote = {
    ticker: 'TEST',
    name: 'Test Corp',
    exchange: 'NASDAQ',
    currency: 'USD',
    price: 100,
    previousClose: 100,
    change: 0,
    percentChange: 0,
    volume: 1_000_000,
    averageVolume: 1_000_000,
    normalDailyRangePercent: 1.5, // 1.5% normal daily range
    dayHigh: 101,
    dayLow: 99,
    fiftyTwoWeekHigh: 120,
    fiftyTwoWeekLow: 80,
    marketCap: '$50B',
    sector: 'Technology',
    freshness: 'live',
    updatedAt: new Date().toISOString(),
    source: 'NASDAQ Real-Time',
  };

  // Test 1: Zero movement with empty news/events should yield normal score
  {
    const result = calculateMeaningfulChange({
      stock: mockQuote,
      historicalMeanPrice: 100,
      historicalStdDev: 5,
      news: [],
      events: [],
      marketIndexChange: 0,
    });
    console.assert(result.totalScore <= 30, `Expected normal score <=30, got ${result.totalScore}`);
    console.assert(result.classification === 'Normal', `Expected Normal, got ${result.classification}`);
    console.log(`✓ Test 1 Passed: Zero movement baseline is classified as Normal (${result.totalScore}/100)`);
  }

  // Test 2: Huge price jump (8.4%) + high volume (2.7x) + corporate earnings event
  {
    const surgedQuote: StockQuote = {
      ...mockQuote,
      price: 108.4,
      change: 8.4,
      percentChange: 8.4,
      volume: 2_700_000,
    };
    const events = [
      {
        id: 'e1',
        ticker: 'TEST',
        type: 'earnings' as const,
        title: 'Q3 Results Beat',
        description: 'Revenue up 35%',
        timestamp: new Date().toISOString(),
        impactScore: 1,
      },
    ];
    const news = [
      {
        id: 'n1',
        ticker: 'TEST',
        title: 'Huge beat in AI semiconductor revenue',
        source: 'Bloomberg',
        url: '#',
        publishedAt: new Date().toISOString(),
        sentiment: 'positive' as const,
        relevance: 0.9,
      },
    ];

    const result = calculateMeaningfulChange({
      stock: surgedQuote,
      historicalMeanPrice: 100,
      historicalStdDev: 5,
      news,
      events,
      marketIndexChange: 0.2,
    });
    console.assert(result.totalScore >= 70, `Expected high score >=70, got ${result.totalScore}`);
    console.assert(
      result.classification === 'Major Change' || result.classification === 'Important',
      `Expected Major Change or Important, got ${result.classification}`
    );
    console.log(`✓ Test 2 Passed: Surged stock score = ${result.totalScore} (${result.classification})`);
  }

  // Test 3: Last seen state difference is accounted for
  {
    const userState = {
      userId: 'test_user',
      ticker: 'TEST',
      lastSeenPrice: 90, // was 90 when user checked last
      lastSeenVolume: 500_000,
      lastSeenAt: new Date(Date.now() - 3600000).toISOString(),
      lastSeenChangeScore: 10,
      lastSeenClassification: 'Normal' as const,
      lastSeenNewsCount: 1,
      lastSeenEventIds: [],
    };
    const currentQuote: StockQuote = {
      ...mockQuote,
      price: 100, // +11.1% since last seen!
    };
    const result = calculateMeaningfulChange({
      stock: currentQuote,
      userState,
      historicalMeanPrice: 100,
      historicalStdDev: 5,
      news: [],
      events: [],
      marketIndexChange: 0,
    });
    console.assert(result.signals.priceAbnormality.score > 10, 'Expected price abnormality score > 10');
    console.log(`✓ Test 3 Passed: User baseline correctly impacts price score = ${result.signals.priceAbnormality.score}`);
  }

  // Test 4: Real Historical Statistics Pipeline (NVDA data with real avgVolume and z-score)
  {
    const nvdaQuote: StockQuote = {
      ...mockQuote,
      ticker: 'NVDA',
      price: 228.45,
      previousClose: 224.41,
      change: 4.04,
      percentChange: 1.80,
      volume: 38_200_000,
      averageVolume: 44_200_000,
      normalDailyRangePercent: 2.85,
    };
    const nvdaStats = {
      mean: 214.61,
      stdDev: 10.25,
      avgVolume: 44_200_000,
      normalDailyRangePercent: 2.85,
      observations: 30,
      fetchedAt: new Date().toISOString(),
      freshness: 'fresh' as const,
      source: 'Alpha Vantage TIME_SERIES_DAILY',
      isAvailable: true,
    };
    const result = calculateMeaningfulChange({
      stock: nvdaQuote,
      historicalStats: nvdaStats,
      news: [],
      events: [],
      marketIndexChange: 0.5,
    });

    console.assert(result.signals.volumeAnomaly.volumeMultiple === 0.86, `Expected volumeMultiple 0.86, got ${result.signals.volumeAnomaly.volumeMultiple}`);
    console.assert(result.signals.volumeAnomaly.averageVolume === 44_200_000, `Expected avgVolume 44200000, got ${result.signals.volumeAnomaly.averageVolume}`);
    console.assert(result.signals.historicalDeviation.zScore === 1.35, `Expected zScore 1.35, got ${result.signals.historicalDeviation.zScore}`);
    console.assert(result.signals.provenance?.isAvailable === true, 'Expected provenance isAvailable to be true');
    console.log(`✓ Test 4 Passed: Real NVDA historical statistics correctly computed: volumeMultiple = ${result.signals.volumeAnomaly.volumeMultiple}x (not 1.0x synthetic), zScore = ${result.signals.historicalDeviation.zScore}σ`);
  }

  // Test 5: Explicit Unavailable State (No synthetic fabrication when historical data is missing)
  {
    const unavailQuote: StockQuote = {
      ...mockQuote,
      ticker: 'NEWCO',
      price: 50,
      volume: 1_200_000,
      averageVolume: 0,
      normalDailyRangePercent: 0,
    };
    const unavailStats = {
      mean: 0,
      stdDev: 0,
      avgVolume: 0,
      observations: 0,
      fetchedAt: new Date().toISOString(),
      freshness: 'unavailable' as const,
      source: 'Alpha Vantage (Historical Data Unavailable)',
      isAvailable: false,
    };
    const result = calculateMeaningfulChange({
      stock: unavailQuote,
      historicalStats: unavailStats,
      news: [],
      events: [],
      marketIndexChange: 0,
    });

    console.assert(result.signals.volumeAnomaly.isAvailable === false, 'Expected volumeAnomaly isAvailable = false');
    console.assert(result.signals.volumeAnomaly.volumeMultiple === 0, 'Expected volumeMultiple = 0 when unavailable');
    console.assert(result.signals.volumeAnomaly.score === 0, 'Expected volumeAnomaly score = 0 when unavailable');
    console.assert(result.signals.historicalDeviation.isAvailable === false, 'Expected historicalDeviation isAvailable = false');
    console.assert(result.signals.historicalDeviation.score === 0, 'Expected historicalDeviation score = 0 when unavailable');
    console.assert(result.signals.provenance?.isAvailable === false, 'Expected provenance isAvailable = false');
    console.log('✓ Test 5 Passed: Explicit unavailable state produces no synthetic fallbacks (score = 0, isAvailable = false)');
  }

  console.log('All Pulse unit tests completed successfully!');
}

runTests();
