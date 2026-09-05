/**
 * Alpha Vantage Real Market Data Adapter
 * 
 * Strict Data Fallback Hierarchy:
 * 1. REAL API RESPONSE (Alpha Vantage) -> cached in-memory with TTL
 * 2. CACHED REAL API RESPONSE -> if within cache window, marked as cached/delayed
 * 3. STALE REAL DATA -> if past cache TTL, marked as stale
 * 4. EXPLICIT UNAVAILABLE STATE -> error returned, NEVER mock data
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import type { StockQuote, StockHistory, HistoricalPoint, MarketFreshness, HistoricalStats } from '../../src/types';

interface CachedQuote {
  quote: StockQuote;
  cachedAt: number;
}

interface CachedHistory {
  history: StockHistory;
  cachedAt: number;
}

interface CachedStats {
  mean: number;
  stdDev: number;
  avgVolume: number;
  normalDailyRangePercent?: number;
  observations: number;
  cachedAt: number;
  source: string;
}

export class AlphaVantageAdapter {
  private apiKey: string;
  private quoteCache = new Map<string, CachedQuote>();
  private historyCache = new Map<string, CachedHistory>();
  private statsCache = new Map<string, CachedStats>();
  private inFlightQuoteRequests = new Map<string, Promise<StockQuote | null>>();
  private inFlightHistoryRequests = new Map<string, Promise<any>>();
  private cacheFilePath = process.env.VERCEL
    ? path.join('/tmp', 'alphaVantageCache.json')
    : path.join(process.cwd(), 'server', 'cache', 'alphaVantageCache.json');

  // Cache TTL configurations
  private readonly QUOTE_TTL_MS = 3 * 60 * 1000; // 3 minutes
  private readonly HISTORY_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
  private readonly STATS_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

  // Rate limit tracking (Alpha Vantage standard: 5 calls / min)
  private callTimestamps: number[] = [];
  private readonly MAX_CALLS_PER_MINUTE = 5;

  constructor() {
    this.apiKey = process.env.MARKET_DATA_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[AlphaVantageAdapter] WARNING: MARKET_DATA_API_KEY is not set in environment.');
    }
    this.loadDiskCache();
  }

  /**
   * Loads persistent cache from disk so real Alpha Vantage data is preserved across restarts and rate limits
   */
  private loadDiskCache(): void {
    try {
      const bundledCache = path.join(process.cwd(), 'server', 'cache', 'alphaVantageCache.json');
      const targetFile = fs.existsSync(this.cacheFilePath) ? this.cacheFilePath : (fs.existsSync(bundledCache) ? bundledCache : null);
      if (targetFile) {
        const raw = fs.readFileSync(targetFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.quotes) {
          for (const [k, v] of Object.entries(parsed.quotes)) {
            this.quoteCache.set(k.toUpperCase(), v as CachedQuote);
          }
        }
        if (parsed.histories) {
          for (const [k, v] of Object.entries(parsed.histories)) {
            this.historyCache.set(k.toUpperCase(), v as CachedHistory);
          }
        }
        if (parsed.stats) {
          for (const [k, v] of Object.entries(parsed.stats)) {
            this.statsCache.set(k.toUpperCase(), v as CachedStats);
          }
        }
        console.log(`[AlphaVantageAdapter] Loaded disk cache: ${this.quoteCache.size} quotes, ${this.statsCache.size} stats`);
      }
    } catch (err: any) {
      console.warn(`[AlphaVantageAdapter] Could not load disk cache: ${err.message}`);
    }
  }

  /**
   * Persists the current in-memory cache to disk
   */
  private saveDiskCache(): void {
    try {
      const dir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        quotes: Object.fromEntries(this.quoteCache.entries()),
        histories: Object.fromEntries(this.historyCache.entries()),
        stats: Object.fromEntries(this.statsCache.entries()),
      };
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err: any) {
      console.warn(`[AlphaVantageAdapter] Could not save disk cache: ${err.message}`);
    }
  }

  /**
   * Resolves common symbol variants (e.g. Indian stocks on BSE/NSE)
   */
  private resolveSymbol(ticker: string): string {
    const sym = ticker.toUpperCase();
    if (sym === 'TCS') return 'TCS.BSE';
    if (sym === 'RELIANCE') return 'RELIANCE.BSE';
    if (sym === 'INFY') return 'INFY.BSE';
    return sym;
  }

  /**
   * Checks if we are approaching Alpha Vantage call limits in the current 60s sliding window
   */
  private canMakeCall(): boolean {
    const now = Date.now();
    this.callTimestamps = this.callTimestamps.filter((t) => now - t < 60000);
    return this.callTimestamps.length < this.MAX_CALLS_PER_MINUTE;
  }

  private recordCall(): void {
    this.callTimestamps.push(Date.now());
  }

  /**
   * Native HTTPS GET helper
   */
  private fetchJson<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err: any) {
            reject(new Error(`Failed to parse Alpha Vantage response: ${err.message}`));
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Fetches Real Stock Quote from Alpha Vantage GLOBAL_QUOTE
   */
  public async getQuote(rawTicker: string): Promise<StockQuote | null> {
    const ticker = rawTicker.toUpperCase();
    const symbol = this.resolveSymbol(ticker);
    const now = Date.now();

    // 1. Check in-memory fresh cache
    const cached = this.quoteCache.get(ticker);
    if (cached && now - cached.cachedAt < this.QUOTE_TTL_MS) {
      return {
        ...cached.quote,
        freshness: (now - cached.cachedAt > 60000 ? 'delayed' : 'live') as MarketFreshness,
      };
    }

    // 2. Request deduplication: check if this symbol is already in flight
    if (this.inFlightQuoteRequests.has(ticker)) {
      return this.inFlightQuoteRequests.get(ticker)!;
    }

    // 3. Rate-limit check: if throttled, use existing cached real quote if available
    if (!this.canMakeCall()) {
      if (cached) {
        console.warn(`[AlphaVantageAdapter] Rate limit approaching; serving cached real quote for ${ticker}`);
        return {
          ...cached.quote,
          freshness: 'delayed',
          source: 'Alpha Vantage (Cached • Rate Limit Protected)',
        };
      }
    }

    if (!this.apiKey) {
      console.error('[AlphaVantageAdapter] Cannot fetch quote: MARKET_DATA_API_KEY missing');
      return cached ? cached.quote : null;
    }

    // Execute real request with deduplication
    const quotePromise: Promise<StockQuote | null> = (async (): Promise<StockQuote | null> => {
      try {
        this.recordCall();
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${this.apiKey}`;
        const data: any = await this.fetchJson(url);

        // Check for rate limit note or information message from Alpha Vantage
        if (data['Note'] || data['Information']) {
          const msg = data['Note'] || data['Information'];
          console.warn(`[AlphaVantageAdapter] Provider notice: ${msg}`);
          if (cached) {
            return {
              ...cached.quote,
              freshness: 'delayed' as MarketFreshness,
              source: 'Alpha Vantage (Cached • Provider Notice)',
            };
          }
          return null;
        }

        const gq = data['Global Quote'];
        if (!gq || !gq['05. price']) {
          console.warn(`[AlphaVantageAdapter] No Global Quote returned for ${ticker}:`, data);
          return cached ? cached.quote : null;
        }

        const price = parseFloat(gq['05. price']);
        const previousClose = parseFloat(gq['08. previous close']) || price;
        const change = parseFloat(gq['09. change']) || (price - previousClose);
        const percentStr = (gq['10. change percent'] || '0%').replace('%', '');
        const percentChange = parseFloat(percentStr);
        const volume = parseInt(gq['06. volume'], 10) || 0;
        const dayHigh = parseFloat(gq['03. high']) || price;
        const dayLow = parseFloat(gq['04. low']) || price;

        // Determine currency and exchange
        const isIndian = symbol.endsWith('.BSE') || symbol.endsWith('.NSE');
        const currency = isIndian ? 'INR' : 'USD';
        const exchange = isIndian ? 'BSE' : 'NASDAQ';

        // Retrieve real historical stats from cache if already calculated
        const cachedStats = this.statsCache.get(ticker);
        const cachedHistory = this.historyCache.get(ticker);
        
        // Compute period high/low honestly from historical points if available
        let periodHigh: number | undefined = undefined;
        let periodLow: number | undefined = undefined;
        if (cachedHistory && cachedHistory.history.points.length > 0) {
          const histPrices = cachedHistory.history.points.map((p) => p.price);
          periodHigh = Math.max(...histPrices, dayHigh);
          periodLow = Math.min(...histPrices, dayLow);
        }

        const quote: StockQuote = {
          ticker,
          name: this.getCompanyName(ticker),
          exchange,
          currency,
          price: Number(price.toFixed(2)),
          previousClose: Number(previousClose.toFixed(2)),
          change: Number(change.toFixed(2)),
          percentChange: Number(percentChange.toFixed(2)),
          volume,
          averageVolume: cachedStats ? cachedStats.avgVolume : 0, // Genuine 30-day average, or 0 if pending
          normalDailyRangePercent: cachedStats?.normalDailyRangePercent || 0, // Genuine 30-day average daily swing
          dayHigh: Number(dayHigh.toFixed(2)),
          dayLow: Number(dayLow.toFixed(2)),
          fiftyTwoWeekHigh: periodHigh !== undefined ? Number(periodHigh.toFixed(2)) : undefined,
          fiftyTwoWeekLow: periodLow !== undefined ? Number(periodLow.toFixed(2)) : undefined,
          marketCap: 'Unavailable (Standard Tier)',
          sector: this.getSector(ticker),
          updatedAt: new Date().toISOString(),
          source: 'Alpha Vantage',
          freshness: 'delayed' as MarketFreshness,
          dataDiscrepancy: undefined,
        };

        // Store in cache and persist
        this.quoteCache.set(ticker, { quote, cachedAt: Date.now() });
        this.saveDiskCache();
        return quote;
      } catch (err: any) {
        console.error(`[AlphaVantageAdapter] Error fetching quote for ${ticker}:`, err.message);
        if (cached) {
          const staleQuote: StockQuote = {
            ...cached.quote,
            freshness: 'stale' as MarketFreshness,
            source: 'Alpha Vantage (Stale Cache)',
          };
          return staleQuote;
        }
        return null;
      } finally {
        this.inFlightQuoteRequests.delete(ticker);
      }
    })();

    this.inFlightQuoteRequests.set(ticker, quotePromise);
    return quotePromise;
  }

  /**
   * Fetches Real Daily Time Series from Alpha Vantage TIME_SERIES_DAILY
   */
  public async getDailyHistory(rawTicker: string): Promise<any | null> {
    const ticker = rawTicker.toUpperCase();
    const symbol = this.resolveSymbol(ticker);
    const now = Date.now();

    const cached = this.historyCache.get(ticker);
    if (cached && now - cached.cachedAt < this.HISTORY_TTL_MS) {
      return cached.history;
    }

    if (this.inFlightHistoryRequests.has(ticker)) {
      return this.inFlightHistoryRequests.get(ticker);
    }

    if (!this.canMakeCall()) {
      if (cached) return cached.history;
      return null;
    }

    if (!this.apiKey) return null;

    const historyPromise = (async () => {
      try {
        this.recordCall();
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${this.apiKey}`;
        const data: any = await this.fetchJson(url);

        const series = data['Time Series (Daily)'];
        if (!series) {
          console.warn(`[AlphaVantageAdapter] No Time Series (Daily) for ${ticker}:`, data['Note'] || data['Information'] || data);
          return cached ? cached.history : null;
        }

        const dates = Object.keys(series).sort().reverse(); // newest first
        const points: HistoricalPoint[] = [];
        const dailyRanges: number[] = [];
        const dailyHighs: number[] = [];
        const dailyLows: number[] = [];

        for (const d of dates.slice(0, 30)) {
          const item = series[d];
          const closePrice = parseFloat(item['4. close']);
          const highPrice = parseFloat(item['2. high']) || closePrice;
          const lowPrice = parseFloat(item['3. low']) || closePrice;
          const vol = parseInt(item['5. volume'], 10) || 0;

          points.push({
            timestamp: d,
            price: closePrice,
            volume: vol,
          });

          if (lowPrice > 0) {
            dailyRanges.push(((highPrice - lowPrice) / lowPrice) * 100);
          }
          dailyHighs.push(highPrice);
          dailyLows.push(lowPrice);
        }

        const history: StockHistory = {
          ticker,
          range: '1M',
          points: [...points].reverse(), // oldest to newest for charts
        };

        this.historyCache.set(ticker, { history, cachedAt: Date.now() });

        // Calculate and cache real historical stats (mean, stdDev, avgVolume, normalDailyRangePercent)
        if (points.length > 0) {
          const prices = points.map((p) => p.price);
          const volumes = points.map((p) => p.volume);
          const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
          const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
          const stdDev = Math.sqrt(variance);
          const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
          const normalDailyRangePercent = dailyRanges.length > 0
            ? Number((dailyRanges.reduce((a, b) => a + b, 0) / dailyRanges.length).toFixed(2))
            : undefined;

          const periodHigh = dailyHighs.length > 0 ? Math.max(...dailyHighs) : undefined;
          const periodLow = dailyLows.length > 0 ? Math.min(...dailyLows) : undefined;

          this.statsCache.set(ticker, {
            mean: Number(mean.toFixed(2)),
            stdDev: Number(stdDev.toFixed(2)),
            avgVolume: Math.round(avgVolume),
            normalDailyRangePercent,
            observations: points.length,
            cachedAt: Date.now(),
            source: 'Alpha Vantage TIME_SERIES_DAILY',
          });

          // Update cached quote if present
          const q = this.quoteCache.get(ticker);
          if (q) {
            q.quote.averageVolume = Math.round(avgVolume);
            if (normalDailyRangePercent) {
              q.quote.normalDailyRangePercent = normalDailyRangePercent;
            }
            if (periodHigh !== undefined) q.quote.fiftyTwoWeekHigh = Number(periodHigh.toFixed(2));
            if (periodLow !== undefined) q.quote.fiftyTwoWeekLow = Number(periodLow.toFixed(2));
          }

          this.saveDiskCache();
        }

        return history;
      } catch (err: any) {
        console.error(`[AlphaVantageAdapter] Error fetching history for ${ticker}:`, err.message);
        return cached ? cached.history : null;
      } finally {
        this.inFlightHistoryRequests.delete(ticker);
      }
    })();

    this.inFlightHistoryRequests.set(ticker, historyPromise);
    return historyPromise;
  }

  /**
   * Retrieves Real Historical Stats (Mean, StdDev, AvgVolume, NormalDailyRangePercent)
   * calculated honestly from Alpha Vantage TIME_SERIES_DAILY.
   * If real historical data is unavailable, returns explicit unavailable status.
   * NEVER fabricates synthetic fallbacks in Real Mode.
   */
  public async getHistoricalStats(rawTicker: string): Promise<HistoricalStats> {
    const ticker = rawTicker.toUpperCase();
    const now = Date.now();

    // 1. Check existing stats cache
    const cached = this.statsCache.get(ticker);
    if (cached) {
      const isStale = now - cached.cachedAt > this.STATS_TTL_MS;
      return {
        mean: cached.mean,
        stdDev: cached.stdDev,
        avgVolume: cached.avgVolume,
        normalDailyRangePercent: cached.normalDailyRangePercent,
        observations: cached.observations,
        fetchedAt: new Date(cached.cachedAt).toISOString(),
        freshness: isStale ? 'stale' : 'fresh',
        source: isStale ? `${cached.source} (Stale Cache)` : cached.source,
        isAvailable: true,
      };
    }

    // 2. Attempt to load daily history to populate stats
    await this.getDailyHistory(ticker);
    const updated = this.statsCache.get(ticker);
    if (updated) {
      return {
        mean: updated.mean,
        stdDev: updated.stdDev,
        avgVolume: updated.avgVolume,
        normalDailyRangePercent: updated.normalDailyRangePercent,
        observations: updated.observations,
        fetchedAt: new Date(updated.cachedAt).toISOString(),
        freshness: 'fresh',
        source: updated.source,
        isAvailable: true,
      };
    }

    // 3. Fallback: DO NOT INVENT SYNTHETIC DATA. Explicitly mark as unavailable.
    return {
      mean: 0,
      stdDev: 0,
      avgVolume: 0,
      normalDailyRangePercent: undefined,
      observations: 0,
      fetchedAt: new Date().toISOString(),
      freshness: 'unavailable',
      source: 'Alpha Vantage (Historical Data Unavailable)',
      isAvailable: false,
    };
  }

  private getCompanyName(ticker: string): string {
    const names: Record<string, string> = {
      NVDA: 'NVIDIA Corporation',
      AAPL: 'Apple Inc.',
      TSLA: 'Tesla, Inc.',
      MSFT: 'Microsoft Corporation',
      AMZN: 'Amazon.com, Inc.',
      GOOGL: 'Alphabet Inc.',
      META: 'Meta Platforms, Inc.',
      TCS: 'Tata Consultancy Services',
      RELIANCE: 'Reliance Industries',
      INFY: 'Infosys Limited',
    };
    return names[ticker] || ticker;
  }

  private getSector(ticker: string): string {
    const sectors: Record<string, string> = {
      NVDA: 'Semiconductors & AI',
      AAPL: 'Consumer Electronics',
      TSLA: 'Automotive & Clean Energy',
      MSFT: 'Software & Cloud Infrastructure',
      AMZN: 'E-Commerce & Cloud Computing',
      GOOGL: 'Internet Services & AI',
      META: 'Social Media & Virtual Reality',
      TCS: 'IT Consulting & Software',
      RELIANCE: 'Energy & Conglomerate',
      INFY: 'Digital Services & Consulting',
    };
    return sectors[ticker] || 'Equities';
  }
}

export const alphaVantageAdapter = new AlphaVantageAdapter();
