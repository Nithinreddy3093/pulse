import { useState, useEffect } from 'react';
import { Search, X, Plus, Check, TrendingUp } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import type { StockQuote } from '../types';

interface SearchModalProps {
  currentTickers: string[];
  onAddTicker: (ticker: string) => void;
  onRemoveTicker: (ticker: string) => void;
  onClose: () => void;
}

export function SearchModal({
  currentTickers,
  onAddTicker,
  onRemoveTicker,
  onClose,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.searchStocks(query, controller.signal);
        if (active) {
          setStocks(res);
          setLoading(false);
        }
      } catch {
        if (active) {
          setLoading(false);
        }
      }
    }, 150);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="search-stocks-modal"
        className="bg-white border border-[#E2E8F0] rounded-2xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[85vh]"
      >
        {/* Search Input Header */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-[#94A3B8] shrink-0" />
          <input
            id="search-stocks-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search US & Indian equities (e.g. NVDA, Apple, Reliance, INFY)..."
            autoFocus
            className="w-full bg-transparent border-none text-[#0F1B3D] placeholder-[#94A3B8] text-sm focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-[#94A3B8] hover:text-[#0F1B3D]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#0F1B3D] hover:bg-[#F8FAFC] rounded-lg ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Available Stocks List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 bg-[#F8FAFC]">
          {loading ? (
            <div className="py-8 text-center text-xs text-[#94A3B8]">
              Querying market registry...
            </div>
          ) : stocks.length === 0 ? (
            <div className="py-12 text-center text-[#94A3B8] text-sm">
              No matching ticker or company name found.
            </div>
          ) : (
            stocks.map((s) => {
              const isAdded = currentTickers.includes(s.ticker);
              return (
                <div
                  key={s.ticker}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0F1B3D] text-[#10B981] font-bold flex items-center justify-center text-xs">
                      {s.ticker.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0F1B3D] text-sm">{s.ticker}</span>
                        <span className="text-[10px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.5 rounded font-semibold">
                          {s.exchange}
                        </span>
                        <span className="text-xs text-[#0F1B3D] font-bold">
                          {s.currency === 'INR' ? '₹' : '$'}{s.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] truncate max-w-xs">{s.name}</p>
                    </div>
                  </div>

                  <button
                    id={`btn-toggle-stock-${s.ticker}`}
                    type="button"
                    onClick={() => (isAdded ? onRemoveTicker(s.ticker) : onAddTicker(s.ticker))}
                    className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
                      isAdded
                        ? 'bg-[#ECFDF5] text-[#059669] border border-emerald-200 hover:bg-[#FEF2F2] hover:text-[#DC2626] hover:border-red-200'
                        : 'bg-[#0F1B3D] text-white hover:bg-[#18264D] shadow-xs'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Watchlist</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#E2E8F0] bg-white text-xs text-[#64748B] text-center font-medium">
          Tracking {currentTickers.length} stocks in your personal baseline.
        </div>
      </div>
    </div>
  );
}
