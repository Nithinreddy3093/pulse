/**
 * Pulse — News & Corporate Event Service
 * 
 * Strict Fallback Hierarchy:
 * 1. REAL API RESPONSE (NewsAPI)
 * 2. CACHED REAL API ARTICLES (within TTL)
 * 3. STALE REAL ARTICLES
 * 4. EMPTY / UNAVAILABLE STATE (returns [], NEVER fabricated mock news in Real Mode)
 * 
 * DEMO MODE:
 * Only if demoService.getActiveScenario() is non-null, returns isolated DEMO fixtures.
 */

import type { NewsArticle, StockEvent } from '../../src/types';
import { newsApiAdapter } from '../adapters/newsApiAdapter';
import { DEMO_NEWS_DATABASE, DEMO_EVENTS_DATABASE } from '../demo/demoUniverse';
import { demoService } from './demoService';

/**
 * Retrieves news articles for a ticker
 */
export async function getNewsForTicker(rawTicker: string): Promise<NewsArticle[]> {
  const ticker = rawTicker.toUpperCase();

  // 1. If Demo Simulator is active
  if (demoService.getActiveScenario() !== null) {
    return DEMO_NEWS_DATABASE.filter((n) => n.ticker === ticker);
  }

  // 2. REAL MODE: Query NewsAPI Adapter
  return await newsApiAdapter.getNewsForTicker(ticker);
}

/**
 * Retrieves verified corporate events for a ticker
 * Real Mode only extracts events from actual NewsAPI reports
 */
export async function getEventsForTicker(rawTicker: string): Promise<StockEvent[]> {
  const ticker = rawTicker.toUpperCase();

  // 1. If Demo Simulator is active
  if (demoService.getActiveScenario() !== null) {
    return DEMO_EVENTS_DATABASE.filter((e) => e.ticker === ticker);
  }

  // 2. REAL MODE: Extract verified events from real NewsAPI coverage
  return await newsApiAdapter.getVerifiedEventsForTicker(ticker);
}

/**
 * Retrieves global market news
 */
export async function getMarketNews(): Promise<NewsArticle[]> {
  // 1. If Demo Simulator is active
  if (demoService.getActiveScenario() !== null) {
    return DEMO_NEWS_DATABASE;
  }

  // 2. REAL MODE: Top financial headlines from NewsAPI
  return await newsApiAdapter.getMarketNews();
}
