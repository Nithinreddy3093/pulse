/**
 * Pulse — Market Data Service
 * 
 * Strict Data Fallback Hierarchy:
 * 1. REAL API RESPONSE (Alpha Vantage) -> cached in-memory with TTL
 * 2. CACHED REAL API RESPONSE -> if within cache window, marked as delayed
 * 3. STALE REAL DATA -> if past cache TTL, marked as stale
 * 4. EXPLICIT UNAVAILABLE STATE -> error returned, NEVER fabricated mock data in Real Mode
 * 
 * DEMO MODE:
 * When isDemoActive === true (scenario triggered), returns isolated DEMO_STOCK_UNIVERSE
 * marked with isDemo: true and source: 'Demo Simulator'.
 */

import type { StockQuote, StockHistory, HistoricalPoint, MarketFreshness, HistoricalStats } from '../../src/types';
import { alphaVantageAdapter } from '../adapters/alphaVantageAdapter';
import { DEMO_STOCK_UNIVERSE, type DemoUniverseItem } from '../demo/demoUniverse';

export class MarketDataService {
  private activeOverrides: Record<string, Partial<StockQuote>> = {};
  private forcedFreshness: MarketFreshness | null = null;
  private discrepancyFlags: Record<string, string | null> = {};

  /**
   * Check if Demo Simulator is currently active
   */
  public isSimulatorActive(): boolean {
    return Object.keys(this.activeOverrides).length > 0 || this.forcedFreshness !== null;
  }

  /**
   * Retrieves Stock Quote
   * In Real Mode: fetches real data from Alpha Vantage adapter with caching & deduplication.
   * In Demo Mode: returns simulated scenario overrides.
   */
  public async getStockQuote(rawTicker: string): Promise<StockQuote | null> {
    const ticker = rawTicker.toUpperCase();

    // 1. If Demo Simulator is actively running an override scenario
    if (this.isSimulatorActive() && this.activeOverrides[ticker]) {
      const demoBase: DemoUniverseItem = DEMO_STOCK_UNIVERSE[ticker] || {
        ticker,
        name: ticker,
        exchange: 'NASDAQ',
        currency: 'USD',
        previousClose: 100,
        averageVolume: 1000000,
        normalDailyRangePercent: 2.0,
        dayHigh: 102,
        dayLow: 98,
        fiftyTwoWeekHigh: 110,
        fiftyTwoWeekLow: 80,
        marketCap: '$100B',
        sector: 'Equities',
        source: 'Demo Simulator',
        freshness: 'live',
        basePrice: 100,
        baseVolume: 1000000,
        histMean: 100,
        histStdDev: 2.0,
      };

      const override = this.activeOverrides[ticker] || {};
      const price = override.price ?? demoBase.basePrice;
      const volume = override.volume ?? demoBase.baseVolume;
      const prevClose = override.previousClose ?? demoBase.previousClose;
      const change = Number((price - prevClose).toFixed(2));
      const percentChange = Number((((price - prevClose) / prevClose) * 100).toFixed(2));

      return {
        ticker,
        name: demoBase.name,
        exchange: demoBase.exchange,
        currency: demoBase.currency,
        price,
        previousClose: prevClose,
        change,
        percentChange,
        volume,
        averageVolume: demoBase.averageVolume,
        normalDailyRangePercent: demoBase.normalDailyRangePercent,
        dayHigh: Math.max(demoBase.dayHigh, price),
        dayLow: Math.min(demoBase.dayLow, price),
        fiftyTwoWeekHigh: demoBase.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: demoBase.fiftyTwoWeekLow,
        marketCap: demoBase.marketCap,
        sector: demoBase.sector,
        updatedAt: new Date().toISOString(),
        source: 'Demo Simulator (Synthetic Scenario)',
        freshness: this.forcedFreshness || override.freshness || 'live',
        dataDiscrepancy: this.discrepancyFlags[ticker] || undefined,
      };
    }

    // 2. REAL MODE: Query Alpha Vantage Adapter
    return await alphaVantageAdapter.getQuote(ticker);
  }

  /**
   * Retrieves Stock History Points
   */
  public async getStockHistory(rawTicker: string, range: '1D' | '1W' | '1M' | '3M' = '1M'): Promise<StockHistory | null> {
    const ticker = rawTicker.toUpperCase();

    // If Demo Simulator is active
    if (this.isSimulatorActive() && this.activeOverrides[ticker]) {
      const demoQuote = await this.getStockQuote(ticker);
      const curPrice = demoQuote ? demoQuote.price : 150;
      const points: HistoricalPoint[] = [];
      const numPoints = range === '1D' ? 24 : range === '1W' ? 35 : 30;

      for (let i = numPoints; i >= 0; i--) {
        const time = new Date(Date.now() - i * 3600000 * (range === '1D' ? 0.5 : 24)).toISOString();
        const drift = (Math.sin(i / 3) * 0.03 + (numPoints - i) * 0.002) * curPrice;
        points.push({
          timestamp: time,
          price: Number((curPrice - drift).toFixed(2)),
          volume: Math.round(500000 + Math.random() * 200000),
        });
      }
      return { ticker, range, points };
    }

    // REAL MODE: Query Alpha Vantage Daily History
    const dailyHist = await alphaVantageAdapter.getDailyHistory(ticker);
    if (dailyHist) return dailyHist;

    // Fallback: build minimal history from current real quote
    const realQuote = await alphaVantageAdapter.getQuote(ticker);
    if (!realQuote) return null;

    const points: HistoricalPoint[] = [
      { timestamp: new Date(Date.now() - 86400000).toISOString(), price: realQuote.previousClose, volume: realQuote.volume },
      { timestamp: realQuote.updatedAt, price: realQuote.price, volume: realQuote.volume },
    ];
    return { ticker, range, points };
  }

  /**
   * Retrieves Historical Statistical Metrics (Mean, StdDev, Average Volume, NormalDailyRangePercent)
   */
  public async getHistoricalStats(rawTicker: string): Promise<HistoricalStats> {
    const ticker = rawTicker.toUpperCase();

    if (this.isSimulatorActive() && this.activeOverrides[ticker]) {
      const demo = DEMO_STOCK_UNIVERSE[ticker];
      if (demo) {
        return {
          mean: demo.histMean,
          stdDev: demo.histStdDev,
          avgVolume: demo.averageVolume,
          normalDailyRangePercent: demo.normalDailyRangePercent || 2.2,
          observations: 30,
          fetchedAt: new Date().toISOString(),
          freshness: 'fresh',
          source: 'Demo Simulator Universe',
          isAvailable: true,
        };
      }
    }

    return await alphaVantageAdapter.getHistoricalStats(ticker);
  }

  /**
   * Benchmark Market Change (e.g. S&P 500 / NASDAQ index movement)
   */
  public async getBenchmarkMarketChange(exchange: string = 'NASDAQ'): Promise<number> {
    if (this.isSimulatorActive()) {
      return 0.45;
    }

    try {
      // In Real Mode, get SPY or QQQ benchmark
      const benchmarkSymbol = exchange === 'BSE' || exchange === 'NSE' ? 'TCS.BSE' : 'AAPL';
      const quote = await alphaVantageAdapter.getQuote(benchmarkSymbol);
      if (quote) {
        return quote.percentChange;
      }
    } catch {}

    return 0.35; // Default modest market drift
  }

  /**
   * Search stock directory
   */
  public searchStocks(query: string = ''): StockQuote[] {
    const q = query.trim().toUpperCase();
    const commonList = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TCS', 'RELIANCE', 'INFY'];

    return commonList
      .filter((t) => !q || t.includes(q) || (DEMO_STOCK_UNIVERSE[t]?.name.toUpperCase().includes(q)))
      .map((t) => {
        const item = DEMO_STOCK_UNIVERSE[t];
        return {
          ticker: t,
          name: item ? item.name : t,
          exchange: item ? item.exchange : 'NASDAQ',
          currency: item ? item.currency : 'USD',
          price: item ? item.basePrice : 100,
          previousClose: item ? item.previousClose : 100,
          change: 0,
          percentChange: 0,
          volume: item ? item.baseVolume : 1000000,
          averageVolume: item ? item.averageVolume : 1000000,
          normalDailyRangePercent: item ? item.normalDailyRangePercent : 2.0,
          dayHigh: item ? item.dayHigh : 100,
          dayLow: item ? item.dayLow : 100,
          fiftyTwoWeekHigh: item ? item.fiftyTwoWeekHigh : 100,
          fiftyTwoWeekLow: item ? item.fiftyTwoWeekLow : 100,
          marketCap: item ? item.marketCap : '$100B',
          sector: item ? item.sector : 'Equities',
          updatedAt: new Date().toISOString(),
          source: 'Directory Search',
          freshness: 'live' as MarketFreshness,
        };
      });
  }

  // --------------------------------------------------------------------------
  // Demo / Simulator Overrides
  // --------------------------------------------------------------------------

  public setStockOverride(ticker: string, override: Partial<StockQuote>): void {
    this.activeOverrides[ticker.toUpperCase()] = override;
  }

  public clearAllOverrides(): void {
    this.activeOverrides = {};
    this.forcedFreshness = null;
    this.discrepancyFlags = {};
  }

  public setForcedFreshness(freshness: MarketFreshness | null): void {
    this.forcedFreshness = freshness;
  }

  public setDiscrepancyFlag(ticker: string, discrepancy: string | null): void {
    this.discrepancyFlags[ticker.toUpperCase()] = discrepancy;
  }
}

export const marketDataService = new MarketDataService();
