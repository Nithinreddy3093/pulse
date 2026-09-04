/**
 * Comprehensive Integration Verification Test
 * 
 * Tests:
 * 1. MARKET_DATA_API_KEY flow: Alpha Vantage fetch -> real quote -> ChangeEngine -> scoring
 * 2. NEWS_API_KEY flow: NewsAPI fetch -> real financial articles
 * 3. Fallback hierarchy: unavailable / stale handling when ticker is invalid, never mock universe
 * 4. Token verification: verifyFirebaseIdToken handling
 * 5. Deterministic change engine calculations
 */

import { alphaVantageAdapter } from '../server/adapters/alphaVantageAdapter';
import { newsApiAdapter } from '../server/adapters/newsApiAdapter';
import { marketDataService } from '../server/services/marketDataService';
import { calculateMeaningfulChange } from '../server/services/changeEngine';
import { verifyFirebaseIdToken } from '../server/auth/tokenVerifier';

async function runAuditVerification() {
  console.log('=== STARTING PULSE DATA-SOURCE & INTEGRATION AUDIT VERIFICATION ===\n');

  // 1. Verify Alpha Vantage live integration
  console.log('1. Testing Alpha Vantage real quote integration...');
  const quote = await alphaVantageAdapter.getQuote('NVDA');
  if (!quote) {
    throw new Error('Alpha Vantage quote returned null');
  }
  console.log(`✓ Alpha Vantage returned live quote for NVDA:`);
  console.log(`  Price: $${quote.price} | PrevClose: $${quote.previousClose} | Change: ${quote.percentChange}%`);
  console.log(`  Source: ${quote.source} | Freshness: ${quote.freshness}`);
  if (quote.source.includes('Synthetic') || quote.source.includes('Mock')) {
    throw new Error('FAIL: Alpha Vantage returned synthetic/mock data in real mode!');
  }

  // 2. Verify NewsAPI live integration
  console.log('\n2. Testing NewsAPI real financial news integration...');
  const news = await newsApiAdapter.getNewsForTicker('NVDA');
  console.log(`✓ NewsAPI returned ${news.length} real news articles for NVDA`);
  if (news.length > 0) {
    console.log(`  Sample Headline: "${news[0].title}"`);
    console.log(`  Publisher: ${news[0].source} | Published: ${news[0].publishedAt}`);
    if (news[0].source.includes('Synthetic') || news[0].source.includes('Mock')) {
      throw new Error('FAIL: NewsAPI returned synthetic/mock articles in real mode!');
    }
  }

  // 3. Verify Deterministic ChangeEngine on real data
  console.log('\n3. Testing ChangeEngine signal traceability with real Alpha Vantage stats...');
  const stats = await marketDataService.getHistoricalStats('NVDA');
  console.log(`✓ Real NVDA Historical Stats:`);
  console.log(`  30-Day Mean: $${stats.mean} | 30-Day StdDev: $${stats.stdDev} | 30-Day AvgVolume: ${stats.avgVolume.toLocaleString()}`);
  console.log(`  Source: ${stats.source} | Freshness: ${stats.freshness} | Observations: ${stats.observations}`);

  if (stats.avgVolume === quote.volume) {
    throw new Error('FAIL: averageVolume is still identical to current volume (synthetic)!');
  }
  if (stats.mean === quote.price && stats.stdDev === Number((quote.price * 0.02).toFixed(2))) {
    throw new Error('FAIL: historical stats are falling back to synthetic (price * 0.02)!');
  }

  const changeResult = calculateMeaningfulChange({
    stock: quote,
    historicalStats: stats,
    news,
    events: [],
    marketIndexChange: 1.2,
  });
  console.log(`✓ ChangeEngine evaluated score: ${changeResult.totalScore}/100 (${changeResult.classification})`);
  console.log(`  Volume Anomaly multiple: ${changeResult.signals.volumeAnomaly.volumeMultiple}x (real multiple, not synthetic 1.0x)`);
  console.log(`  Historical Deviation zScore: ${changeResult.signals.historicalDeviation.zScore}σ`);
  console.log(`  Summary bullets:`);
  for (const b of changeResult.summaryBullets) {
    console.log(`   - ${b}`);
  }

  // 3b. Verify second ticker (AAPL)
  console.log('\n3b. Testing second ticker (AAPL) real stats and pipeline...');
  const aaplQuote = await alphaVantageAdapter.getQuote('AAPL');
  if (!aaplQuote) throw new Error('Alpha Vantage AAPL quote returned null');
  const aaplStats = await marketDataService.getHistoricalStats('AAPL');
  console.log(`✓ Real AAPL Historical Stats:`);
  console.log(`  Price: $${aaplQuote.price} | PrevClose: $${aaplQuote.previousClose} | Volume: ${aaplQuote.volume.toLocaleString()}`);
  console.log(`  30-Day AvgVolume: ${aaplStats.avgVolume.toLocaleString()} | 30-Day Mean: $${aaplStats.mean} | StdDev: $${aaplStats.stdDev}`);
  const aaplChange = calculateMeaningfulChange({
    stock: aaplQuote,
    historicalStats: aaplStats,
    news: [],
    events: [],
    marketIndexChange: 0.2,
  });
  console.log(`✓ AAPL ChangeEngine Score: ${aaplChange.totalScore}/100, Volume multiple: ${aaplChange.signals.volumeAnomaly.volumeMultiple}x`);

  // 4. Verify Strict Fallback Hierarchy (Real -> Cached -> Stale -> Unavailable, NEVER mock universe)
  console.log('\n4. Testing Strict Fallback: unknown ticker MUST return null/unavailable, NOT mock data...');
  const invalidQuote = await alphaVantageAdapter.getQuote('NONEXISTENT_SYMBOL_XYZ_123');
  if (invalidQuote !== null) {
    throw new Error(`FAIL: Invalid ticker should return null/unavailable, but got: ${JSON.stringify(invalidQuote)}`);
  }
  console.log('✓ Invalid ticker correctly returned null/unavailable without falling back to mock fixtures.');

  // 5. Verify Firebase Token Verification Logic
  console.log('\n5. Testing Firebase token verification module...');
  const mockToken = 'invalid-test-token';
  try {
    await verifyFirebaseIdToken(mockToken);
    throw new Error('FAIL: Invalid token was accepted');
  } catch (err: any) {
    if (err.message.includes('Invalid JWT format') || err.message.includes('verification failed')) {
      console.log(`✓ verifyFirebaseIdToken correctly rejected unauthorized token: "${err.message}"`);
    } else {
      throw err;
    }
  }

  console.log('\n=== ALL AUDIT VERIFICATIONS PASSED SUCCESSFULLY ===');
}

runAuditVerification().catch((err) => {
  console.error('Audit verification failed:', err);
  process.exit(1);
});
