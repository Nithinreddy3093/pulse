import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, ArrowRight, Sparkles, Filter } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface NewsViewProps {
  onSelectStock: (ticker: string) => void;
}

export function NewsView({ onSelectStock }: NewsViewProps) {
  const [news, setNews] = useState<any[]>([]);
  const [category, setCategory] = useState<'all' | 'watchlist' | 'market'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      const res = await apiClient.getNews();
      if (res?.news) setNews(res.news);
      setLoading(false);
    }
    loadNews();
  }, []);

  const filtered = news.filter((item) => {
    if (category === 'all') return true;
    return item.category === category;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B3D] tracking-tight">Market Intelligence & News</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Curated financial updates filtered for real relevance and market impact.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] p-1 rounded-xl text-xs font-semibold shadow-2xs">
          {(['all', 'watchlist', 'market'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                category === cat
                  ? 'bg-[#0F1B3D] text-white'
                  : 'text-[#64748B] hover:text-[#0F1B3D]'
              }`}
            >
              {cat === 'all' ? 'All News' : cat === 'watchlist' ? 'Watchlist Equities' : 'Macro & Tech'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item, idx) => {
          const isPositive = item.sentiment === 'positive';
          const isNegative = item.sentiment === 'negative';

          return (
            <div
              key={item.id ? `${item.id}-${idx}` : `news-${idx}`}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs hover:border-[#CBD5E1] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0F1B3D] bg-[#F1F5F9] px-2.5 py-0.5 rounded-lg">
                      {item.source}
                    </span>
                    <span className="text-[11px] text-[#94A3B8]">{item.publishedAt}</span>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      isPositive
                        ? 'bg-[#ECFDF5] text-[#059669] border-emerald-200'
                        : isNegative
                        ? 'bg-[#FEF2F2] text-[#DC2626] border-red-200'
                        : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                    }`}
                  >
                    {item.sentiment}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#0F1B3D] leading-snug mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed mb-4">
                  {item.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                {item.ticker && item.ticker !== 'MACRO' && item.ticker !== 'TECH' ? (
                  <button
                    type="button"
                    onClick={() => onSelectStock(item.ticker)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] hover:underline"
                  >
                    <span>View {item.ticker} signals</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-[11px] text-[#94A3B8]">Broad Market Impact</span>
                )}

                <span className="text-[11px] text-[#94A3B8]">Verified Wire</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
