import { useState } from 'react';
import { 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCheck, 
  MoreVertical, 
  Check, 
  Trash2, 
  ArrowRight,
  Filter,
  Sparkles,
  Bookmark
} from 'lucide-react';
import type { WatchlistSummary, WatchlistItemWithChange } from '../types';

interface WatchlistViewProps {
  summary: WatchlistSummary | null;
  onSelectStock: (ticker: string) => void;
  onOpenSearch: () => void;
  onMarkSeen: (ticker: string) => void;
  onMarkAllSeen: () => void;
  onRemoveStock: (ticker: string) => void;
}

export function WatchlistView({
  summary,
  onSelectStock,
  onOpenSearch,
  onMarkSeen,
  onMarkAllSeen,
  onRemoveStock,
}: WatchlistViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'major' | 'watching' | 'normal'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'change' | 'ticker'>('score');
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);

  if (!summary || summary.items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4 px-4">
        <div className="w-14 h-14 rounded-2xl bg-white border border-[#E2E8F0] text-[#0F1B3D] flex items-center justify-center mx-auto shadow-xs">
          <Bookmark className="w-6 h-6 text-[#3B82F6]" />
        </div>
        <h2 className="text-xl font-bold text-[#0F1B3D]">Your watchlist is empty</h2>
        <p className="text-xs text-[#64748B] leading-relaxed">
          Add stocks to your personal watchlist to track price anomalies, unusual volume surges, and corporate events.
        </p>
        <button
          type="button"
          onClick={onOpenSearch}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F1B3D] hover:bg-[#18264D] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add your first stock</span>
        </button>
      </div>
    );
  }

  // Filter items
  let filtered = summary.items.filter((item) => {
    const matchesSearch = 
      item.stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterStatus === 'major') return item.changeResult.totalScore > 75;
    if (filterStatus === 'watching') return item.changeResult.totalScore > 30 && item.changeResult.totalScore <= 75;
    if (filterStatus === 'normal') return item.changeResult.totalScore <= 30;
    return true;
  });

  // Sort items
  filtered.sort((a, b) => {
    if (sortBy === 'score') return b.changeResult.totalScore - a.changeResult.totalScore;
    if (sortBy === 'change') return Math.abs(b.stock.percentChange) - Math.abs(a.stock.percentChange);
    return a.stock.ticker.localeCompare(b.stock.ticker);
  });

  const getStatusPill = (score: number) => {
    if (score > 75) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
          Major change
        </span>
      );
    }
    if (score > 30) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D97706] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
          Worth watching
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
        No significant change
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B3D] tracking-tight">My Watchlist</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Track your personalized portfolio and understand what meaningfully changed.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onMarkAllSeen}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F1B3D] transition-colors shadow-2xs"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Mark All as Seen</span>
          </button>

          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F1B3D] hover:bg-[#18264D] text-xs font-semibold text-white transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter stocks by ticker or name..."
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#0F1B3D] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6] transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto text-xs font-semibold">
          {[
            { id: 'all', label: 'All' },
            { id: 'major', label: 'Major changes' },
            { id: 'watching', label: 'Worth watching' },
            { id: 'normal', label: 'Stable' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-[#0F1B3D] text-white border-[#0F1B3D]'
                  : 'bg-white text-[#64748B] border-[#E2E8F0] hover:text-[#0F1B3D]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 text-xs text-[#64748B] shrink-0 self-end md:self-auto">
          <span>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#0F1B3D] focus:outline-none"
          >
            <option value="score">Change Score</option>
            <option value="change">% Move</option>
            <option value="ticker">Ticker Name</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold">
                <th className="py-3.5 px-4">Company</th>
                <th className="py-3.5 px-4">Current Price</th>
                <th className="py-3.5 px-4">Day Change</th>
                <th className="py-3.5 px-4">Change Score</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Since You Last Checked</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filtered.map((item) => {
                const isPos = item.stock.change >= 0;
                const currSymbol = item.stock.currency === 'INR' ? '₹' : '$';
                const scoreVal = item.changeResult.totalScore;
                const isMajorChange = scoreVal > 75;
                const isWatchingChange = scoreVal > 30 && scoreVal <= 75;

                return (
                  <tr
                    key={item.stock.ticker}
                    onClick={() => onSelectStock(item.stock.ticker)}
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0F1B3D] text-[#10B981] font-bold text-xs flex items-center justify-center shrink-0">
                          {item.stock.ticker.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#0F1B3D] group-hover:text-[#3B82F6] transition-colors">
                            {item.stock.name}
                          </div>
                          <div className="text-[11px] text-[#64748B]">
                            {item.stock.ticker} • {item.stock.exchange}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-sm text-[#0F1B3D]">
                      {currSymbol}{item.stock.price.toFixed(2)}
                    </td>

                    <td className="py-4 px-4 font-bold">
                      <span className={`inline-flex items-center gap-0.5 ${isPos ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {isPos ? '+' : ''}{item.stock.percentChange.toFixed(2)}%
                      </span>
                    </td>

                    <td className="py-4 px-4 font-extrabold text-sm">
                      <span className={isMajorChange ? 'text-[#DC2626]' : isWatchingChange ? 'text-[#D97706]' : 'text-[#059669]'}>
                        {scoreVal}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] font-normal"> / 100</span>
                    </td>

                    <td className="py-4 px-4">
                      {getStatusPill(scoreVal)}
                    </td>

                    <td className="py-4 px-4 text-[#64748B]">
                      {item.userState ? (
                        <div>
                          <span className="line-through text-[11px]">{currSymbol}{item.userState.lastSeenPrice.toFixed(2)}</span>
                          <span className="mx-1.5 font-bold">→</span>
                          <span className={`font-bold ${item.priceDeltaSinceLastSeen >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {item.priceDeltaSinceLastSeen >= 0 ? '+' : ''}{item.percentDeltaSinceLastSeen.toFixed(2)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#94A3B8] italic">Baseline recorded</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onSelectStock(item.stock.ticker)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#3B82F6] hover:bg-[#EFF6FF] rounded-lg transition-colors"
                        >
                          Deep Dive
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenRowMenu(openRowMenu === item.stock.ticker ? null : item.stock.ticker)}
                          className="p-1.5 text-[#64748B] hover:text-[#0F1B3D] rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {openRowMenu === item.stock.ticker && (
                        <div className="absolute right-4 mt-1 w-40 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-1.5 z-20 text-left">
                          <button
                            type="button"
                            onClick={() => { onMarkSeen(item.stock.ticker); setOpenRowMenu(null); }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#059669] hover:bg-[#ECFDF5] rounded-lg font-medium"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark as Seen</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => { onRemoveStock(item.stock.ticker); setOpenRowMenu(null); }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
