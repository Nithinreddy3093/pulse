import { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRight, 
  AlertTriangle, 
  Eye, 
  CheckCircle2, 
  MoreVertical, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Layers, 
  Check, 
  Trash2 
} from 'lucide-react';
import type { WatchlistSummary, WatchlistItemWithChange } from '../types';
import { apiClient } from '../services/apiClient';

interface HomeViewProps {
  summary: WatchlistSummary | null;
  loading: boolean;
  onSelectStock: (ticker: string) => void;
  onOpenSearch: () => void;
  onViewWatchlist: () => void;
  onViewInsights: () => void;
  onViewNews: () => void;
  onMarkSeen: (ticker: string) => void;
  onRemoveStock: (ticker: string) => void;
  userName?: string;
}

export function HomeView({
  summary,
  loading,
  onSelectStock,
  onOpenSearch,
  onViewWatchlist,
  onViewInsights,
  onViewNews,
  onMarkSeen,
  onRemoveStock,
  userName = 'Investor',
}: HomeViewProps) {
  const [marketTab, setMarketTab] = useState<'indices' | 'sectors' | 'movers'>('indices');
  const [marketIndices, setMarketIndices] = useState<any[]>([]);
  const [marketSectors, setMarketSectors] = useState<any[]>([]);
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [openRowAction, setOpenRowAction] = useState<string | null>(null);

  useEffect(() => {
    async function loadMarketData() {
      const [overviewRes, sectorsRes, newsRes] = await Promise.all([
        apiClient.getMarketOverview(),
        apiClient.getMarketSectors(),
        apiClient.getNews(),
      ]);
      if (overviewRes?.indices) setMarketIndices(overviewRes.indices);
      if (sectorsRes?.sectors) setMarketSectors(sectorsRes.sectors);
      if (newsRes?.news) setLatestNews(newsRes.news.slice(0, 4));
    }
    loadMarketData();
  }, []);

  const majorCount = summary ? summary.majorChangesCount : 0;
  const watchingCount = summary ? summary.worthWatchingCount : 0;
  const normalCount = summary ? summary.normalCount : 0;

  // Filter items that need user attention (Major Change, Important, or Worth Watching)
  const attentionItems = summary?.items.filter(
    (i) => i.changeResult.classification === 'Major Change' || 
           i.changeResult.classification === 'Important' || 
           i.changeResult.classification === 'Worth Watching'
  ) || [];

  const renderSparkline = (points?: number[], isPositive: boolean = true) => {
    const pts = points && points.length >= 2 ? points : [100, 101, 100.5, 102, 101.8, isPositive ? 104 : 97];
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const range = max - min || 1;
    const width = 64;
    const height = 24;
    const step = width / (pts.length - 1);

    const pathData = pts
      .map((val, idx) => {
        const x = idx * step;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    const strokeColor = isPositive ? '#10B981' : '#EF4444';

    return (
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const getCompanyLogo = (ticker: string) => {
    switch (ticker.toUpperCase()) {
      case 'NVDA':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#76B900] text-white font-bold text-xs flex items-center justify-center">
            N
          </div>
        );
      case 'TCS':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#0072C6] text-white font-bold text-[10px] flex items-center justify-center">
            tcs
          </div>
        );
      case 'AAPL':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#0F1B3D] text-white font-bold text-xs flex items-center justify-center">
            
          </div>
        );
      case 'MSFT':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#00A4EF] text-white font-bold text-xs flex items-center justify-center">
            M
          </div>
        );
      case 'TSLA':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#E82127] text-white font-bold text-xs flex items-center justify-center">
            T
          </div>
        );
      case 'RELIANCE':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#D97706] text-white font-bold text-xs flex items-center justify-center">
            R
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-[#E2E8F0] text-[#0F1B3D] font-bold text-xs flex items-center justify-center">
            {ticker.slice(0, 2)}
          </div>
        );
    }
  };

  const getStatusBadge = (score: number, classification: string) => {
    if (score > 75 || classification === 'Major Change') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#DC2626] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-red-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
          Major change
        </span>
      );
    }
    if (score > 30 || classification === 'Worth Watching' || classification === 'Important') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D97706] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
          Worth watching
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
        No significant change
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatRelativeTime = (timestamp?: string | null) => {
    if (!timestamp) return 'Previous close';
    try {
      const date = new Date(timestamp);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 2) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Previous close';
    }
  };

  // Compute dynamic top movers from user's watchlist
  const topMovers = summary?.items
    ? [...summary.items]
        .sort((a, b) => Math.abs(b.stock.percentChange) - Math.abs(a.stock.percentChange))
        .slice(0, 3)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1B3D] tracking-tight">
            Good day, {userName}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {summary?.lastCheckedAt
              ? `Changes detected in your watchlist since your last visit (${formatRelativeTime(summary.lastCheckedAt)})`
              : 'Tracking real-time volatility, volume anomalies, and material news shifts across your watchlist.'}
          </p>
        </div>

        <button
          id="btn-add-stock-header"
          type="button"
          onClick={onOpenSearch}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F1B3D] hover:bg-[#18264D] text-white font-semibold text-xs transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stock</span>
        </button>
      </div>

      {/* 3 Summary Cards (Unified with Real State) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Major Changes */}
        <div className="bg-[#FEF2F2] border border-red-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-3xl font-black text-[#DC2626] tracking-tight mb-1">
              {majorCount}
            </div>
            <div className="text-sm font-bold text-[#0F1B3D]">Major changes</div>
            <div className="text-xs text-[#64748B] mt-0.5">Need your attention</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/80 text-[#DC2626] flex items-center justify-center shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Worth Watching */}
        <div className="bg-[#FFFBEB] border border-amber-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-3xl font-black text-[#D97706] tracking-tight mb-1">
              {watchingCount}
            </div>
            <div className="text-sm font-bold text-[#0F1B3D]">Worth watching</div>
            <div className="text-xs text-[#64748B] mt-0.5">Keep an eye on these</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/80 text-[#D97706] flex items-center justify-center shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* No Significant Change */}
        <div className="bg-[#F0FDF4] border border-emerald-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-3xl font-black text-[#059669] tracking-tight mb-1">
              {normalCount}
            </div>
            <div className="text-sm font-bold text-[#0F1B3D]">No significant change</div>
            <div className="text-xs text-[#64748B] mt-0.5">Trading within normal parameters</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/80 text-[#059669] flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left 2/3, Right 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section: Needs Your Attention */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0F1B3D]">Needs Your Attention</h2>
              {attentionItems.length > 0 && (
                <button
                  type="button"
                  onClick={onViewWatchlist}
                  className="text-xs font-semibold text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {loading ? (
              <div className="p-8 text-center bg-white border border-[#E2E8F0] rounded-2xl">
                <div className="inline-block animate-spin w-6 h-6 border-2 border-[#3B82F6] border-t-transparent rounded-full mb-2" />
                <p className="text-xs text-[#64748B]">Analyzing market changes...</p>
              </div>
            ) : attentionItems.length === 0 ? (
              /* All Caught Up State */
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#0F1B3D]">All caught up</div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    None of your tracked assets have experienced abnormal volatility, sudden volume spikes, or material breaking events since your last visit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onViewWatchlist}
                  className="px-4 py-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F1B3D] shrink-0"
                >
                  View Watchlist
                </button>
              </div>
            ) : (
              /* Dynamic Attention Cards */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attentionItems.slice(0, 4).map((item) => {
                  const isPos = item.stock.percentChange >= 0;
                  const score = item.changeResult.totalScore;
                  const classification = item.changeResult.classification;

                  return (
                    <div 
                      key={item.stock.ticker}
                      className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs hover:border-[#CBD5E1] transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Bar */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            {getCompanyLogo(item.stock.ticker)}
                            <div>
                              <div className="font-bold text-sm text-[#0F1B3D]">{item.stock.name}</div>
                              <div className="text-[11px] text-[#64748B]">
                                {item.stock.ticker} • {item.stock.exchange}
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(score, classification)}
                        </div>

                        {/* Price & Sparkline */}
                        <div className="flex items-baseline justify-between py-2 border-b border-[#E2E8F0]">
                          <div>
                            <div className="text-xl font-bold text-[#0F1B3D]">
                              {formatCurrency(item.stock.price, item.stock.currency)}
                            </div>
                            <div className={`text-xs font-semibold flex items-center gap-0.5 ${isPos ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                              {isPos ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                              {isPos ? '+' : ''}{item.stock.percentChange.toFixed(2)}%
                            </div>
                          </div>
                          <div>
                            {renderSparkline(undefined, isPos)}
                          </div>
                        </div>

                        {/* Signals List */}
                        <ul className="space-y-1.5 my-3.5 text-xs text-[#0F1B3D]">
                          {item.changeResult.summaryBullets.slice(0, 3).map((bullet, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                idx === 0 ? (score > 70 ? 'bg-[#DC2626]' : 'bg-[#D97706]') : 'bg-[#3B82F6]'
                              }`} />
                              <span className="line-clamp-1">{bullet}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Comparison Box */}
                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs space-y-1 my-3">
                          <div className="flex justify-between text-[#64748B]">
                            <span>You last checked:</span>
                            <span className="font-medium text-[#0F1B3D]">
                              {item.userState && item.userState.lastSeenPrice > 0
                                ? `${formatCurrency(item.userState.lastSeenPrice, item.stock.currency)} (${formatRelativeTime(item.userState.lastSeenAt)})`
                                : `${formatCurrency(item.stock.previousClose, item.stock.currency)} (Session open)`}
                            </span>
                          </div>
                          <div className="flex justify-between text-[#64748B]">
                            <span>Current price:</span>
                            <span className={`font-bold ${isPos ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                              {formatCurrency(item.stock.price, item.stock.currency)} ({isPos ? '+' : ''}{item.stock.percentChange.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectStock(item.stock.ticker)}
                        className="w-full mt-2 py-2 rounded-xl bg-[#0F1B3D] hover:bg-[#18264D] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>View details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Context callout card */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-[#EFF6FF] to-[#ECFDF5] border border-[#BFDBFE] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white text-[#10B981] flex items-center justify-center shadow-xs shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F1B3D]">Deterministic signals. Real context.</div>
                  <div className="text-[11px] text-[#64748B]">
                    Clear explanations powered by volatility baselines and verified news.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onViewInsights}
                className="text-xs font-bold text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1 shrink-0"
              >
                <span>Explore insights</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section: Your Watchlist Table (Dynamic) */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-[#E2E8F0]">
              <h2 className="text-base font-bold text-[#0F1B3D]">Your Watchlist</h2>
              <button
                type="button"
                onClick={onViewWatchlist}
                className="text-xs font-semibold text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1"
              >
                <span>View full watchlist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                    <th className="py-3 px-2">Name</th>
                    <th className="py-3 px-2">Price</th>
                    <th className="py-3 px-2">Day Change</th>
                    <th className="py-3 px-2">Change Score</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Last Checked</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {(!summary?.items || summary.items.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#64748B]">
                        No stocks tracked yet. Use &ldquo;Add Stock&rdquo; above to start tracking symbols.
                      </td>
                    </tr>
                  ) : (
                    summary.items.map((item) => {
                      const isPos = item.stock.percentChange >= 0;
                      const score = item.changeResult.totalScore;
                      const sym = item.stock.ticker;

                      return (
                        <tr 
                          key={sym}
                          className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                          onClick={() => onSelectStock(sym)}
                        >
                          <td className="py-3.5 px-2">
                            <div className="flex items-center gap-2.5">
                              {getCompanyLogo(sym)}
                              <div>
                                <div className="font-bold text-[#0F1B3D] group-hover:text-[#3B82F6] transition-colors">
                                  {item.stock.name}
                                </div>
                                <div className="text-[11px] text-[#64748B]">{sym}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-2 font-bold text-[#0F1B3D]">
                            {formatCurrency(item.stock.price, item.stock.currency)}
                          </td>
                          <td className={`py-3.5 px-2 font-semibold ${isPos ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {isPos ? '+' : ''}{item.stock.percentChange.toFixed(2)}%
                          </td>
                          <td className={`py-3.5 px-2 font-bold ${
                            score > 70 ? 'text-[#DC2626]' : score > 30 ? 'text-[#D97706]' : 'text-[#059669]'
                          }`}>
                            {score}
                          </td>
                          <td className="py-3.5 px-2">{getStatusBadge(score, item.changeResult.classification)}</td>
                          <td className="py-3.5 px-2 text-[#64748B]">
                            {formatRelativeTime(item.userState?.lastSeenAt)}
                          </td>
                          <td className="py-3.5 px-2 text-right relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setOpenRowAction(openRowAction === sym ? null : sym)}
                              className="p-1.5 text-[#64748B] hover:text-[#0F1B3D] rounded-lg"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {openRowAction === sym && (
                              <div className="absolute right-0 mt-1 w-36 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-1 z-20 text-left">
                                <button
                                  type="button"
                                  onClick={() => { onSelectStock(sym); setOpenRowAction(null); }}
                                  className="w-full px-2.5 py-1.5 text-xs text-[#0F1B3D] hover:bg-[#F8FAFC] rounded-lg font-medium text-left"
                                >
                                  View Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { onMarkSeen(sym); setOpenRowAction(null); }}
                                  className="w-full px-2.5 py-1.5 text-xs text-[#10B981] hover:bg-[#ECFDF5] rounded-lg font-medium text-left"
                                >
                                  Mark as Seen
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { onRemoveStock(sym); setOpenRowAction(null); }}
                                  className="w-full px-2.5 py-1.5 text-xs text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg font-medium text-left"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Column */}
        <div className="space-y-6">
          {/* Card: Market at a glance */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-sm text-[#0F1B3D]">Market at a glance</h3>
              <span className="text-[10px] font-semibold text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-emerald-200">
                ● Live Data
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] mb-4">
              {new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMarketTab('indices')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  marketTab === 'indices'
                    ? 'bg-white text-[#0F1B3D] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F1B3D]'
                }`}
              >
                Indices
              </button>
              <button
                type="button"
                onClick={() => setMarketTab('sectors')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  marketTab === 'sectors'
                    ? 'bg-white text-[#0F1B3D] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F1B3D]'
                }`}
              >
                Sectors
              </button>
              <button
                type="button"
                onClick={() => setMarketTab('movers')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  marketTab === 'movers'
                    ? 'bg-white text-[#0F1B3D] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F1B3D]'
                }`}
              >
                Top Movers
              </button>
            </div>

            {/* Tab Contents */}
            {marketTab === 'indices' && (
              <div className="space-y-3">
                {marketIndices.map((idx) => {
                  const isPos = idx.change >= 0;
                  return (
                    <div
                      key={idx.symbol}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors border border-transparent hover:border-[#E2E8F0]"
                    >
                      <div>
                        <div className="font-bold text-xs text-[#0F1B3D]">{idx.symbol}</div>
                        <div className="text-[11px] text-[#64748B]">{idx.exchange}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        {renderSparkline(idx.sparkline, isPos)}
                        <div className="text-right min-w-[70px]">
                          <div className="font-bold text-xs text-[#0F1B3D]">
                            {idx.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                          <div className={`text-[11px] font-semibold ${isPos ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {isPos ? '+' : ''}{idx.percentChange}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {marketTab === 'sectors' && (
              <div className="space-y-3">
                {marketSectors.map((sec) => {
                  const isPos = sec.percentChange >= 0;
                  return (
                    <div
                      key={sec.name}
                      className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#0F1B3D]">{sec.name}</span>
                        <span className={`font-semibold ${isPos ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {isPos ? '+' : ''}{sec.percentChange}%
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        Leader: <span className="font-medium text-[#0F1B3D]">{sec.leader}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {marketTab === 'movers' && (
              <div className="space-y-2.5 text-xs">
                {topMovers.length === 0 ? (
                  <p className="text-xs text-[#64748B] text-center py-3">No watchlist movers available.</p>
                ) : (
                  topMovers.map((item) => {
                    const isPos = item.stock.percentChange >= 0;
                    return (
                      <div 
                        key={item.stock.ticker}
                        onClick={() => onSelectStock(item.stock.ticker)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isPos ? 'bg-[#ECFDF5] border-emerald-200' : 'bg-[#FEF2F2] border-red-200'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-[#0F1B3D]">
                            {item.stock.name} ({item.stock.ticker})
                          </span>
                          <span className="block text-[11px] text-[#64748B]">
                            Score: {item.changeResult.totalScore}/100 • {item.changeResult.classification}
                          </span>
                        </div>
                        <span className={`font-bold ${isPos ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          {isPos ? '+' : ''}{item.stock.percentChange.toFixed(2)}%
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Card: Latest News (Real Financial Wire from NewsAPI) */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-[#0F1B3D]">Latest Financial News</h3>
              <button
                type="button"
                onClick={onViewNews}
                className="text-xs font-semibold text-[#3B82F6] hover:text-[#2563EB] flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {latestNews.length === 0 ? (
                <p className="text-xs text-[#64748B] py-2">Loading financial wire updates...</p>
              ) : (
                latestNews.map((article, idx) => (
                  <div
                    key={article.id ? `${article.id}-${idx}` : `news-${idx}`}
                    onClick={() => {
                      if (article.ticker && article.ticker !== 'MACRO' && article.ticker !== 'TECH') {
                        onSelectStock(article.ticker);
                      }
                    }}
                    className="group cursor-pointer p-2 rounded-xl hover:bg-[#F8FAFC] transition-colors border border-transparent hover:border-[#E2E8F0]"
                  >
                    <h4 className="text-xs font-semibold text-[#0F1B3D] group-hover:text-[#3B82F6] transition-colors line-clamp-2 leading-relaxed">
                      {article.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#94A3B8]">
                      <span>{formatRelativeTime(article.publishedAt)}</span>
                      <span>•</span>
                      <span className="text-[#64748B] font-medium">{article.source}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="p-6 rounded-2xl bg-[#0F1B3D] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-[#18264D] opacity-60 pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2 text-[#10B981] font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>Deterministic Analysis. Verified Evidence.</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            Focus on what meaningfully changed.
          </h3>
          <p className="text-xs text-[#94A3B8] max-w-xl leading-relaxed">
            Pulse evaluates volatility baselines, volume multiples, statistical deviations, and real news so you never have to guess what moved the market.
          </p>
        </div>

        <button
          type="button"
          onClick={onViewInsights}
          className="relative z-10 px-5 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#0F1B3D] font-bold text-xs transition-colors shadow-xs shrink-0 flex items-center gap-2"
        >
          <span>Explore insights</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
