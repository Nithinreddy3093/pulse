import type { 
  StockQuote, 
  StockHistory, 
  WatchlistSummary, 
  AiExplanationResponse, 
  UserStockState 
} from '../types';
import { filterFallbackStocks } from '../data/fallbackStocks';

export class ApiClient {
  private userId: string | null = null;
  private idToken: string | null = null;

  public setUserId(userId: string | null) {
    this.userId = userId;
  }

  public setIdToken(token: string | null) {
    this.idToken = token;
  }

  private getHeaders(hasBody: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (hasBody) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.idToken) {
      headers['Authorization'] = `Bearer ${this.idToken}`;
    }
    if (this.userId) {
      headers['x-user-id'] = this.userId;
    }
    return headers;
  }

  public async searchStocks(query: string = '', signal?: AbortSignal): Promise<StockQuote[]> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (signal?.aborted) return filterFallbackStocks(query);
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`, {
          headers: this.getHeaders(false),
          signal,
        });
        if (!res.ok) {
          if (attempt === 0 && (res.status === 502 || res.status === 503 || res.status === 504)) {
            await new Promise((r) => setTimeout(r, 300));
            continue;
          }
          throw new Error(`HTTP error ${res.status}`);
        }
        const data = await res.json();
        return data.results || filterFallbackStocks(query);
      } catch (e: any) {
        if (signal?.aborted || e?.name === 'AbortError') {
          return filterFallbackStocks(query);
        }
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 350));
          continue;
        }
        console.warn('Market search using directory fallback:', e?.message || e);
        return filterFallbackStocks(query);
      }
    }
    return filterFallbackStocks(query);
  }

  public async getStockQuote(ticker: string): Promise<{ quote: StockQuote; news: any[]; events: any[] } | null> {
    const sym = encodeURIComponent(ticker.toUpperCase());
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`/api/stocks/${sym}`, {
          headers: this.getHeaders(false),
        });
        if (!res.ok) {
          if (attempt === 0 && (res.status === 502 || res.status === 503 || res.status === 504)) {
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }
          throw new Error(`HTTP error ${res.status}`);
        }
        return await res.json();
      } catch (e: any) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        console.warn(`Quote notice for ${ticker}:`, e?.message || e);
        return null;
      }
    }
    return null;
  }

  public async getStockHistory(ticker: string, range: '1D' | '1W' | '1M' | '3M'): Promise<StockHistory | null> {
    const sym = encodeURIComponent(ticker.toUpperCase());
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`/api/stocks/${sym}/history?range=${range}`, {
          headers: this.getHeaders(false),
        });
        if (!res.ok) {
          if (attempt === 0 && (res.status === 502 || res.status === 503 || res.status === 504)) {
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }
          throw new Error(`HTTP error ${res.status}`);
        }
        const data = await res.json();
        return data.history || null;
      } catch (e: any) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        console.warn(`History notice for ${ticker}:`, e?.message || e);
        return null;
      }
    }
    return null;
  }

  public async getWatchlistChanges(
    tickers: string[],
    userStates: Record<string, UserStockState>
  ): Promise<WatchlistSummary | null> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/api/watchlist/changes', {
          method: 'POST',
          headers: this.getHeaders(true),
          body: JSON.stringify({ tickers, userStates }),
        });
        if (!res.ok) {
          if (attempt === 0 && (res.status === 502 || res.status === 503 || res.status === 504)) {
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }
          throw new Error(`HTTP error ${res.status}`);
        }
        return await res.json();
      } catch (e: any) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        console.warn('Watchlist calculation notice:', e?.message || e);
        return null;
      }
    }
    return null;
  }

  public async markAllSeen(
    tickers: string[],
    specificTicker?: string
  ): Promise<Record<string, UserStockState>> {
    try {
      const res = await fetch('/api/watchlist/mark-seen', {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ tickers, specificTicker }),
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return data.updatedStates || {};
    } catch (e: any) {
      console.warn('Mark seen notice:', e?.message || e);
      return {};
    }
  }

  public async explainChange(
    ticker: string,
    userState?: UserStockState
  ): Promise<AiExplanationResponse | null> {
    const sym = encodeURIComponent(ticker.toUpperCase());
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`/api/stocks/${sym}/explain`, {
          method: 'POST',
          headers: this.getHeaders(true),
          body: JSON.stringify({ userState }),
        });
        if (!res.ok) {
          if (attempt === 0 && (res.status === 502 || res.status === 503 || res.status === 504)) {
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }
          throw new Error(`HTTP error ${res.status}`);
        }
        return await res.json();
      } catch (e: any) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        console.warn(`Explanation notice for ${ticker}:`, e?.message || e);
        return null;
      }
    }
    return null;
  }

  public async simulateScenario(scenarioId: string): Promise<boolean> {
    try {
      const res = await fetch('/api/demo/simulate', {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ scenarioId }),
      });
      return res.ok;
    } catch (e: any) {
      console.warn('Demo simulation notice:', e?.message || e);
      return false;
    }
  }

  public async resetDemo(): Promise<boolean> {
    try {
      const res = await fetch('/api/demo/reset', {
        method: 'POST',
        headers: this.getHeaders(true),
      });
      return res.ok;
    } catch (e: any) {
      console.warn('Demo reset notice:', e?.message || e);
      return false;
    }
  }

  public async getMarketOverview(): Promise<{ timestamp: string; indices: any[] }> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/api/market/overview', { headers: this.getHeaders(false) });
        if (!res.ok) {
          if (attempt === 0 && (res.status === 502 || res.status === 503 || res.status === 504)) {
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }
          throw new Error(`HTTP error ${res.status}`);
        }
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error(`Expected JSON but received ${contentType}`);
        }
        return await res.json();
      } catch (e: any) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        console.warn('Market overview notice:', e?.message || e);
        return { timestamp: new Date().toISOString(), indices: [] };
      }
    }
    return { timestamp: new Date().toISOString(), indices: [] };
  }

  public async getMarketSectors(): Promise<{ sectors: any[] }> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/api/market/sectors', { headers: this.getHeaders(false) });
        if (!res.ok) {
          if (attempt === 0 && (res.status === 502 || res.status === 503 || res.status === 504)) {
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }
          throw new Error(`HTTP error ${res.status}`);
        }
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error(`Expected JSON but received ${contentType}`);
        }
        return await res.json();
      } catch (e: any) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        console.warn('Market sectors notice:', e?.message || e);
        return { sectors: [] };
      }
    }
    return { sectors: [] };
  }

  public async getNews(): Promise<{ news: any[] }> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/api/news', { headers: this.getHeaders(false) });
        if (!res.ok) {
          if (attempt === 0 && (res.status === 502 || res.status === 503 || res.status === 504)) {
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }
          throw new Error(`HTTP error ${res.status}`);
        }
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error(`Expected JSON but received ${contentType}`);
        }
        return await res.json();
      } catch (e: any) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        console.warn('News notice:', e?.message || e);
        return { news: [] };
      }
    }
    return { news: [] };
  }
}

export const apiClient = new ApiClient();
