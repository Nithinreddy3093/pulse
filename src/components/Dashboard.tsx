import { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Plus, 
  CheckCheck, 
  RefreshCw 
} from 'lucide-react';
import { StockCard } from './StockCard';
import type { WatchlistSummary, WatchlistItemWithChange } from '../types';

interface DashboardProps {
  summary: WatchlistSummary | null;
  loading: boolean;
  onRefresh: () => void;
  onSelectStock: (ticker: string) => void;
  onAskWhy: (ticker: string) => void;
  onMarkSeen: (ticker: string) => void;
  onMarkAllSeen: () => void;
  onRemoveStock: (ticker: string) => void;
  onOpenSearch: () => void;
}

export function Dashboard({
  summary,
  loading,
  onRefresh,
  onSelectStock,
  onAskWhy,
  onMarkSeen,
  onMarkAllSeen,
  onRemoveStock,
  onOpenSearch,
}: DashboardProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'priority' | 'normal'>('all');

  if (loading && !summary) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#1D1D1F] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[#86868B] font-medium">
          Running deterministic change engine against your personal baseline...
        </p>
      </div>
    );
  }

  if (!summary || summary.totalTracked === 0) {
    return (
      <div id="empty-watchlist-state" className="py-20 px-4 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E5E7] text-[#86868B] flex items-center justify-center mx-auto shadow-xs">
          <Plus className="w-6 h-6 text-[#1D1D1F]" />
        </div>
        <h2 className="text-xl font-bold text-[#1D1D1F]">Your watchlist is empty</h2>
        <p className="text-xs text-[#86868B] leading-relaxed">
          Add stocks to start tracking meaningful market changes and building your personalized historical baseline.
        </p>
        <button
          id="btn-add-first-stock"
          type="button"
          onClick={onOpenSearch}
          className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add your first stock</span>
        </button>
      </div>
    );
  }

  const priorityItems = summary.items.filter((i) => i.changeResult.totalScore > 30);
  const normalItems = summary.items.filter((i) => i.changeResult.totalScore <= 30);

  const displayedItems = filterMode === 'priority'
    ? priorityItems
    : filterMode === 'normal'
    ? normalItems
    : summary.items;

  return (
    <div id="pulse-dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner: What changed while you were away? (Clean Utility / Minimal status-banner) */}
      <div className="bg-white border border-[#E5E5E7] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#86868B]">
              Personalized Watchlist Intelligence
            </span>
            {summary.isDemoActive && (
              <span className="text-[10px] font-bold uppercase bg-[#FEE2E2] text-[#E01414] px-2 py-0.5 rounded-full border border-red-200">
                Demo simulation active
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1D1D1F] tracking-tight">
            {summary.allCaughtUp
              ? "You're all caught up"
              : 'Your market changed while you were away.'}
          </h1>

          <p className="text-xs text-[#86868B] mt-1">
            {summary.allCaughtUp
              ? 'No meaningful changes detected in your watchlist since your last visit. Showing normal baseline tracking.'
              : 'Pulse identified abnormal price velocity, volume anomalies, and corporate developments across your watchlist.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            id="dash-btn-refresh"
            type="button"
            onClick={onRefresh}
            className="text-xs px-3.5 py-2 rounded-xl bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] border border-[#E5E5E7] flex items-center gap-1.5 transition-colors font-medium shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#86868B] ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            id="dash-btn-mark-all-seen"
            type="button"
            onClick={onMarkAllSeen}
            className="text-xs px-4 py-2 rounded-xl bg-[#1D1D1F] hover:bg-black text-white font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <CheckCheck className="w-4 h-4 text-[#24A148]" />
            <span>Mark All as Seen</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards (Clean Utility Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Major Changes */}
        <div
          onClick={() => setFilterMode('priority')}
          className={`cursor-pointer p-4.5 rounded-2xl border transition-all ${
            filterMode === 'priority'
              ? 'border-[#E01414] bg-[#FEE2E2]/30 ring-1 ring-[#E01414]'
              : 'border-[#E5E5E7] bg-white hover:border-[#D2D2D7] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
              Major Changes
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#E01414]" />
          </div>
          <div className="text-2xl font-black text-[#E01414]">{summary.majorChangesCount}</div>
          <span className="text-[11px] text-[#86868B]">Score 76 - 100</span>
        </div>

        {/* Worth Watching */}
        <div
          onClick={() => setFilterMode('priority')}
          className={`cursor-pointer p-4.5 rounded-2xl border transition-all ${
            filterMode === 'priority'
              ? 'border-[#F59E0B] bg-[#FEF3C7]/30 ring-1 ring-[#F59E0B]'
              : 'border-[#E5E5E7] bg-white hover:border-[#D2D2D7] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
              Worth Watching
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
          </div>
          <div className="text-2xl font-black text-[#B45309]">{summary.worthWatchingCount}</div>
          <span className="text-[11px] text-[#86868B]">Score 31 - 75</span>
        </div>

        {/* Normal */}
        <div
          onClick={() => setFilterMode('normal')}
          className={`cursor-pointer p-4.5 rounded-2xl border transition-all ${
            filterMode === 'normal'
              ? 'border-[#24A148] bg-[#DCFCE7]/30 ring-1 ring-[#24A148]'
              : 'border-[#E5E5E7] bg-white hover:border-[#D2D2D7] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
              Normal
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#24A148]" />
          </div>
          <div className="text-2xl font-black text-[#24A148]">{summary.normalCount}</div>
          <span className="text-[11px] text-[#86868B]">Within standard baseline</span>
        </div>

        {/* Total Tracked */}
        <div
          onClick={() => setFilterMode('all')}
          className={`cursor-pointer p-4.5 rounded-2xl border transition-all ${
            filterMode === 'all'
              ? 'border-[#1D1D1F] bg-[#F5F5F7] ring-1 ring-[#1D1D1F]'
              : 'border-[#E5E5E7] bg-white hover:border-[#D2D2D7] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
              Total Tracked
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#1D1D1F]" />
          </div>
          <div className="text-2xl font-black text-[#1D1D1F]">{summary.totalTracked}</div>
          <span className="text-[11px] text-[#86868B]">Personalized portfolio</span>
        </div>
      </div>

      {/* All Caught Up banner if applicable */}
      {summary.allCaughtUp && (
        <div
          id="all-caught-up-banner"
          className="bg-white border border-emerald-200 rounded-2xl p-6 text-center space-y-2 shadow-xs"
        >
          <div className="w-10 h-10 rounded-full bg-[#DCFCE7] text-[#24A148] flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1D1D1F]">You&apos;re all caught up</h3>
          <p className="text-xs text-[#86868B] max-w-lg mx-auto leading-relaxed">
            All tracked stocks are currently trading within their historical volatility bounds. No unusual price velocity, volume surges, or critical events were detected since your last visit.
          </p>
        </div>
      )}

      {/* Primary Section: Needs Your Attention (High priority items first) */}
      {!summary.allCaughtUp && priorityItems.length > 0 && filterMode !== 'normal' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E01414] animate-ping" />
              <h2 className="text-sm font-bold text-[#1D1D1F] uppercase tracking-wider">
                Needs Your Attention
              </h2>
              <span className="text-xs text-[#86868B] font-medium">
                ({priorityItems.length} priority {priorityItems.length === 1 ? 'alert' : 'alerts'})
              </span>
            </div>
            <span className="text-xs text-[#86868B]">Ranked by change importance</span>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {priorityItems.map((item) => (
              <StockCard
                key={item.stock.ticker}
                item={item}
                onSelect={onSelectStock}
                onAskWhy={onAskWhy}
                onMarkSeen={onMarkSeen}
                onRemove={onRemoveStock}
              />
            ))}
          </div>
        </section>
      )}

      {/* Secondary Section: Rest of Watchlist / Normal stocks */}
      {(normalItems.length > 0 || summary.allCaughtUp) && filterMode !== 'priority' && (
        <section className="space-y-4 pt-4 border-t border-[#E5E5E7]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#1D1D1F] uppercase tracking-wider">
                {summary.allCaughtUp ? 'Active Watchlist' : 'Other Watchlist Stocks'}
              </h2>
              <span className="text-xs text-[#86868B] font-medium">
                ({normalItems.length} within normal parameters)
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenSearch}
              className="text-xs text-[#1D1D1F] hover:text-black flex items-center gap-1 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add more stocks</span>
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {normalItems.map((item) => (
              <StockCard
                key={item.stock.ticker}
                item={item}
                onSelect={onSelectStock}
                onAskWhy={onAskWhy}
                onMarkSeen={onMarkSeen}
                onRemove={onRemoveStock}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
