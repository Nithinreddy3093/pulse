import { useState, useEffect } from 'react';
import { Search, Plus, Check, ArrowUpRight, ArrowDownRight, Compass, TrendingUp, Sparkles } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { StockQuote } from '../types';

interface ExploreViewProps {
  watchlistTickers: string[];
  onAddStock: (ticker: string) => void;
  onSelectStock: (ticker: string) => void;
}

export function ExploreView({
  watchlistTickers,
  onAddStock,
  onSelectStock,
}: ExploreViewProps) {
  const [query, setQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadStocks() {
      try {
        const res = await apiClient.searchStocks('');
        if (active && res && res.length > 0) {
          setStocks(res);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadStocks();
    return () => {
      active = false;
    };
  }, []);

  const sectors = ['all', 'Technology', 'Semiconductors', 'Financial Services', 'Automotive', 'Conglomerate'];

  const filtered = stocks.filter((stock) => {
    const matchesQuery =
      stock.ticker.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase());
    if (!matchesQuery) return false;
    if (selectedSector !== 'all' && stock.sector !== selectedSector) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B3D] tracking-tight">Explore Markets</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Discover premier equities, emerging AI innovators, and leading enterprises.
          </p>
        </div>
      </div>

      {/* Search & Sector Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by company or symbol..."
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#0F1B3D] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto text-xs font-semibold">
          {sectors.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSector(sec)}
              className={`px-3 py-1.5 rounded-xl border transition-all capitalize whitespace-nowrap ${
                selectedSector === sec
                  ? 'bg-[#0F1B3D] text-white border-[#0F1B3D]'
                  : 'bg-white text-[#64748B] border-[#E2E8F0] hover:text-[#0F1B3D]'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of stock cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((stk) => {
          const inWatchlist = watchlistTickers.includes(stk.ticker);
          const isPos = stk.change >= 0;
          const curr = stk.currency === 'INR' ? '₹' : '$';

          return (
            <div
              key={stk.ticker}
              onClick={() => onSelectStock(stk.ticker)}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs hover:border-[#CBD5E1] transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#0F1B3D] text-[#10B981] font-bold text-xs flex items-center justify-center">
                      {stk.ticker.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#0F1B3D]">{stk.name}</div>
                      <div className="text-[11px] text-[#64748B]">
                        {stk.ticker} • {stk.exchange}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-md">
                    {stk.sector}
                  </span>
                </div>

                <div className="flex items-baseline justify-between py-2 border-b border-[#E2E8F0]">
                  <span className="text-xl font-bold text-[#0F1B3D]">
                    {curr}{stk.price.toFixed(2)}
                  </span>
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${isPos ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {isPos ? '+' : ''}{stk.percentChange.toFixed(2)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#64748B] my-3">
                  <div>
                    <span>Vol: </span>
                    <span className="font-semibold text-[#0F1B3D]">{(stk.volume / 1e6).toFixed(1)}M</span>
                  </div>
                  <div>
                    <span>Avg Vol: </span>
                    <span className="font-semibold text-[#0F1B3D]">{(stk.averageVolume / 1e6).toFixed(1)}M</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStock(stk.ticker);
                  }}
                  className="text-xs font-bold text-[#3B82F6] hover:underline"
                >
                  Deep dive
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!inWatchlist) onAddStock(stk.ticker);
                  }}
                  disabled={inWatchlist}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    inWatchlist
                      ? 'bg-[#ECFDF5] text-[#059669] border border-emerald-200 cursor-default'
                      : 'bg-[#0F1B3D] text-white hover:bg-[#18264D]'
                  }`}
                >
                  {inWatchlist ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>In Watchlist</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Watchlist</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
