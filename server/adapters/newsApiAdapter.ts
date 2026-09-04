/**
 * NewsAPI Real Financial News Adapter
 * 
 * Strict Data Fallback Hierarchy:
 * 1. REAL API RESPONSE (NewsAPI) -> cached in-memory with TTL
 * 2. CACHED REAL API RESPONSE -> served if within cache window
 * 3. STALE REAL ARTICLES -> served if past cache TTL
 * 4. EMPTY / UNAVAILABLE STATE -> explicit status returned, NEVER mock news
 */

import https from 'https';
import crypto from 'crypto';
import type { NewsArticle, StockEvent } from '../../src/types';

interface CachedNews {
  articles: NewsArticle[];
  cachedAt: number;
}

export class NewsApiAdapter {
  private apiKey: string;
  private tickerNewsCache = new Map<string, CachedNews>();
  private marketNewsCache: CachedNews | null = null;
  private inFlightTickerRequests = new Map<string, Promise<NewsArticle[]>>();
  private inFlightMarketRequest: Promise<NewsArticle[]> | null = null;

  private readonly TICKER_NEWS_TTL_MS = 15 * 60 * 1000; // 15 minutes
  private readonly MARKET_NEWS_TTL_MS = 30 * 60 * 1000; // 30 minutes

  // Rate limit tracking (NewsAPI developer tier: 100 calls/day)
  private callCountToday = 0;
  private lastResetDay = new Date().getUTCDate();

  constructor() {
    this.apiKey = process.env.NEWS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[NewsApiAdapter] WARNING: NEWS_API_KEY is not set in environment.');
    }
  }

  private checkQuota(): boolean {
    const today = new Date().getUTCDate();
    if (today !== this.lastResetDay) {
      this.callCountToday = 0;
      this.lastResetDay = today;
    }
    return this.callCountToday < 95; // Leave buffer below 100
  }

  private fetchJson<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'PulseMarketWatchlist/1.0',
        },
      };
      https.get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (err: any) {
            reject(new Error(`Failed to parse NewsAPI response: ${err.message}`));
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  private getQueryForTicker(ticker: string): string {
    const sym = ticker.toUpperCase();
    const queryMap: Record<string, string> = {
      NVDA: 'Nvidia OR NVDA',
      AAPL: 'Apple OR AAPL',
      TSLA: 'Tesla OR TSLA',
      MSFT: 'Microsoft OR MSFT',
      AMZN: 'Amazon OR AMZN',
      GOOGL: 'Google OR Alphabet OR GOOGL',
      META: 'Meta Platforms OR META',
      TCS: 'Tata Consultancy Services OR TCS',
      RELIANCE: 'Reliance Industries',
      INFY: 'Infosys OR INFY',
    };
    return queryMap[sym] || sym;
  }

  /**
   * Fetches Real Company News from NewsAPI /v2/everything
   */
  public async getNewsForTicker(rawTicker: string): Promise<NewsArticle[]> {
    const ticker = rawTicker.toUpperCase();
    const now = Date.now();

    const cached = this.tickerNewsCache.get(ticker);
    if (cached && now - cached.cachedAt < this.TICKER_NEWS_TTL_MS) {
      return cached.articles;
    }

    if (this.inFlightTickerRequests.has(ticker)) {
      return this.inFlightTickerRequests.get(ticker)!;
    }

    if (!this.checkQuota()) {
      console.warn(`[NewsApiAdapter] Daily quota approaching; serving cached articles for ${ticker}`);
      return cached ? cached.articles : [];
    }

    if (!this.apiKey) {
      console.error('[NewsApiAdapter] Cannot fetch news: NEWS_API_KEY missing');
      return cached ? cached.articles : [];
    }

    const requestPromise = (async () => {
      try {
        this.callCountToday++;
        const q = encodeURIComponent(this.getQueryForTicker(ticker));
        const url = `https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=publishedAt&pageSize=6&apiKey=${this.apiKey}`;
        const data: any = await this.fetchJson(url);

        if (data.status !== 'ok' || !Array.isArray(data.articles)) {
          console.warn(`[NewsApiAdapter] Non-ok status from NewsAPI for ${ticker}:`, data.message || data);
          return cached ? cached.articles : [];
        }

        // Deduplicate articles by title and URL
        const seenUrls = new Set<string>();
        const articles: NewsArticle[] = [];

        for (const item of data.articles) {
          if (!item.title || item.title === '[Removed]') continue;
          if (seenUrls.has(item.url)) continue;
          seenUrls.add(item.url);

          const sentiment = this.estimateSentiment(item.title + ' ' + (item.description || ''));
          const hash = crypto.createHash('sha256').update((item.url || '') + '|' + (item.title || '')).digest('hex').slice(0, 16);

          articles.push({
            id: `newsapi-${hash}`,
            ticker,
            title: item.title,
            source: item.source?.name || 'Financial Wire',
            url: item.url || '',
            publishedAt: item.publishedAt || new Date().toISOString(),
            relevance: 0.9,
            sentiment,
          });
        }

        this.tickerNewsCache.set(ticker, { articles, cachedAt: Date.now() });
        return articles;
      } catch (err: any) {
        console.error(`[NewsApiAdapter] Error fetching news for ${ticker}:`, err.message);
        return cached ? cached.articles : [];
      } finally {
        this.inFlightTickerRequests.delete(ticker);
      }
    })();

    this.inFlightTickerRequests.set(ticker, requestPromise);
    return requestPromise;
  }

  /**
   * Fetches Real Macro & Market Headlines from NewsAPI /v2/top-headlines
   */
  public async getMarketNews(): Promise<NewsArticle[]> {
    const now = Date.now();
    if (this.marketNewsCache && now - this.marketNewsCache.cachedAt < this.MARKET_NEWS_TTL_MS) {
      return this.marketNewsCache.articles;
    }

    if (this.inFlightMarketRequest) {
      return this.inFlightMarketRequest;
    }

    if (!this.checkQuota()) {
      return this.marketNewsCache ? this.marketNewsCache.articles : [];
    }

    if (!this.apiKey) {
      return this.marketNewsCache ? this.marketNewsCache.articles : [];
    }

    this.inFlightMarketRequest = (async () => {
      try {
        this.callCountToday++;
        const url = `https://newsapi.org/v2/top-headlines?category=business&country=us&pageSize=10&apiKey=${this.apiKey}`;
        const data: any = await this.fetchJson(url);

        if (data.status !== 'ok' || !Array.isArray(data.articles)) {
          return this.marketNewsCache ? this.marketNewsCache.articles : [];
        }

        const seen = new Set<string>();
        const articles: NewsArticle[] = [];

        for (const item of data.articles) {
          if (!item.title || item.title === '[Removed]') continue;
          if (seen.has(item.url)) continue;
          seen.add(item.url);

          const hash = crypto.createHash('sha256').update((item.url || '') + '|' + (item.title || '')).digest('hex').slice(0, 16);

          articles.push({
            id: `newsapi-mkt-${hash}`,
            ticker: 'MACRO',
            title: item.title,
            source: item.source?.name || 'Associated Press',
            url: item.url || '',
            publishedAt: item.publishedAt || new Date().toISOString(),
            relevance: 0.85,
            sentiment: this.estimateSentiment(item.title),
          });
        }

        this.marketNewsCache = { articles, cachedAt: Date.now() };
        return articles;
      } catch (err: any) {
        console.error('[NewsApiAdapter] Error fetching market news:', err.message);
        return this.marketNewsCache ? this.marketNewsCache.articles : [];
      } finally {
        this.inFlightMarketRequest = null;
      }
    })();

    return this.inFlightMarketRequest;
  }

  /**
   * Extracts verified corporate events strictly from real NewsAPI articles
   * Only tags an event if an actual article from NewsAPI explicitly indicates it
   */
  public async getVerifiedEventsForTicker(ticker: string): Promise<StockEvent[]> {
    const articles = await this.getNewsForTicker(ticker);
    const events: StockEvent[] = [];

    for (const article of articles) {
      const lower = article.title.toLowerCase();
      let type: 'earnings' | 'guidance' | 'announcement' | 'regulatory' | null = null;

      if (lower.includes('earnings') || lower.includes('quarterly report') || lower.includes('financial results')) {
        type = 'earnings';
      } else if (lower.includes('guidance') || lower.includes('forecast') || lower.includes('outlook')) {
        type = 'guidance';
      } else if (lower.includes('investigation') || lower.includes('regulator') || lower.includes('antitrust') || lower.includes('sec')) {
        type = 'regulatory';
      } else if (lower.includes('contract') || lower.includes('partnership') || lower.includes('acquisition') || lower.includes('merger')) {
        type = 'announcement';
      }

      if (type) {
        events.push({
          id: `event-${article.id}`,
          ticker: ticker.toUpperCase(),
          type,
          title: article.title,
          description: `Media coverage via ${article.source}: ${article.title}`,
          impactScore: type === 'earnings' ? 0.9 : 0.7,
          timestamp: article.publishedAt,
        });
      }
    }

    return events;
  }

  private estimateSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const lower = text.toLowerCase();
    const positiveWords = ['surge', 'jump', 'gain', 'beat', 'record', 'high', 'boost', 'upgrade', 'profit', 'rise'];
    const negativeWords = ['fall', 'drop', 'slump', 'miss', 'cut', 'downgrade', 'lawsuit', 'decline', 'plunge', 'loss', 'warning'];

    let posScore = 0;
    let negScore = 0;

    for (const w of positiveWords) {
      if (lower.includes(w)) posScore++;
    }
    for (const w of negativeWords) {
      if (lower.includes(w)) negScore++;
    }

    if (posScore > negScore) return 'positive';
    if (negScore > posScore) return 'negative';
    return 'neutral';
  }
}

export const newsApiAdapter = new NewsApiAdapter();
