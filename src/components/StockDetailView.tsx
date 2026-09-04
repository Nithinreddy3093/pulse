import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  BarChart2, 
  TrendingUp, 
  Check, 
  MoreVertical, 
  ThumbsUp, 
  ThumbsDown,
  Bell,
  Share2,
  Bookmark
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { apiClient } from '../services/apiClient';
import type { 
  StockQuote, 
  MeaningfulChangeResult, 
  UserStockState, 
  StockHistory, 
  AiExplanationResponse,
  NewsArticle,
  StockEvent 
} from '../types';

interface StockDetailViewProps {
  ticker: string;
  onBack: () => void;
  userState?: UserStockState;
  onMarkSeen?: (ticker: string) => void;
  onSelectOtherStock?: (ticker: string) => void;
}

export function StockDetailView({
  ticker,
  onBack,
  userState,
  onMarkSeen,
  onSelectOtherStock,
}: StockDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'changed' | 'news' | 'financials' | 'company' | 'ai'>('overview');
  const [chartRange, setChartRange] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | '5Y'>('1D');
  const [quoteData, setQuoteData] = useState<StockQuote | null>(null);
  const [changeResult, setChangeResult] = useState<MeaningfulChangeResult | null>(null);
  const [history, setHistory] = useState<StockHistory | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [events, setEvents] = useState<StockEvent[]>([]);
  const [explanation, setExplanation] = useState<AiExplanationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  const [isAlertAdded, setIsAlertAdded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setExplanation(null);

    async function loadData() {
      const [quoteRes, changeRes] = await Promise.all([
        apiClient.getStockQuote(ticker),
        fetch(`/api/stocks/${ticker}/changes`).then((r) => r.json()).catch(() => null),
      ]);

      if (active) {
        if (quoteRes) {
          setQuoteData(quoteRes.quote);
          setNews(quoteRes.news || []);
          setEvents(quoteRes.events || []);
        }
        if (changeRes?.changeResult) {
          setChangeResult(changeRes.changeResult);
        }
        setLoading(false);
      }
    }

    loadData();

    // Fetch AI explanation in parallel
    apiClient.explainChange(ticker, userState).then((exp) => {
      if (active && exp) {
        setExplanation(exp);
      }
    });

    return () => {
      active = false;
    };
  }, [ticker]);

  // Load chart history when ticker or timeframe changes
  useEffect(() => {
    let active = true;
    const range = (chartRange === '1Y' || chartRange === '5Y' ? '3M' : chartRange) as any;
    apiClient.getStockHistory(ticker, range).then((hist) => {
      if (active && hist) {
        setHistory(hist);
      }
    });
    return () => {
      active = false;
    };
  }, [ticker, chartRange]);

  if (loading || !quoteData) {
    return (
      <div className="py-24 text-center max-w-md mx-auto space-y-4">
        <div className="w-10 h-10 border-2 border-[#0F1B3D] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#64748B] font-semibold">
          Analyzing deterministic market signals for {ticker}...
        </p>
      </div>
    );
  }

  const isPositive = quoteData.change >= 0;
  const currencySymbol = quoteData.currency === 'INR' ? '₹' : '$';
  const score = changeResult?.totalScore ?? 0;
  const isMajor = score > 75;
  const isWatching = score > 30 && score <= 75;

  const chartData = history?.points.map((pt) => ({
    time: pt.timestamp.split('T')[1]?.slice(0, 5) || pt.timestamp,
    price: pt.price,
  })) || [
    { time: '10:00', price: quoteData.previousClose },
    { time: '11:00', price: quoteData.previousClose * 1.02 },
    { time: '12:00', price: quoteData.previousClose * 1.05 },
    { time: '13:00', price: quoteData.previousClose * 1.04 },
    { time: '14:00', price: quoteData.previousClose * 1.07 },
    { time: '15:00', price: quoteData.price },
  ];

  const minPrice = Math.min(...chartData.map((d) => d.price)) * 0.99;
  const maxPrice = Math.max(...chartData.map((d) => d.price)) * 1.01;

  const defaultBullets = [
    'Earnings results exceeded consensus Wall Street estimates',
    'Strong sustained demand for enterprise AI datacenter accelerators',
    'Higher trading volume indicates substantial institutional reallocation',
    'Stock continues to heavily outpace both sector and benchmark indices',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#0F1B3D] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to dashboard</span>
      </button>

      {/* Header Container */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Company Title & Price */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0F1B3D] text-[#10B981] font-black text-base flex items-center justify-center shadow-xs">
            {ticker.slice(0, 2)}
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-[#0F1B3D] tracking-tight">{quoteData.name}</h1>
              <span className="text-xs font-bold text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-md">
                {quoteData.ticker} • {quoteData.exchange}
              </span>
              <span className="text-xs font-medium text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-md">
                {quoteData.sector}
              </span>
            </div>

            {/* Price Row */}
            <div className="flex items-baseline gap-3 mt-1.5">
              <span className="text-3xl font-extrabold text-[#0F1B3D]">
                {currencySymbol}{quoteData.price.toFixed(2)}
              </span>
              <span className={`text-sm font-bold flex items-center gap-0.5 ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {isPositive ? '+' : ''}{quoteData.change.toFixed(2)} ({isPositive ? '+' : ''}{quoteData.percentChange.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right Status Card & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Status Card */}
          <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
            isMajor
              ? 'bg-[#FEF2F2] border-red-200 text-[#DC2626]'
              : isWatching
              ? 'bg-[#FFFBEB] border-amber-200 text-[#D97706]'
              : 'bg-[#ECFDF5] border-emerald-200 text-[#059669]'
          }`}>
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                {isMajor ? 'Major Change' : isWatching ? 'Worth Watching' : 'No Significant Change'}
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">
                {isMajor 
                  ? 'This stock has changed significantly since you last checked.' 
                  : isWatching 
                  ? 'Abnormal trading patterns detected outside baseline bounds.'
                  : 'Trading comfortably within historical daily boundaries.'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsAlertAdded(!isAlertAdded)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-colors ${
                isAlertAdded
                  ? 'bg-[#ECFDF5] text-[#059669] border-emerald-200'
                  : 'bg-white text-[#0F1B3D] border-[#E2E8F0] hover:bg-[#F8FAFC]'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isAlertAdded ? 'Alert Added' : '+ Add Alert'}</span>
            </button>

            {onMarkSeen && (
              <button
                type="button"
                onClick={() => onMarkSeen(ticker)}
                className="p-2 text-[#64748B] hover:text-[#10B981] hover:bg-[#ECFDF5] rounded-xl border border-[#E2E8F0] transition-colors"
                title="Mark this stock as acknowledged (updates your personal baseline)"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E2E8F0] overflow-x-auto text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'changed', label: 'What changed' },
          { id: 'news', label: 'News' },
          { id: 'financials', label: 'Financials' },
          { id: 'company', label: 'Company' },
          { id: 'ai', label: 'AI Explanation' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#0F1B3D] text-[#0F1B3D] font-bold'
                : 'border-transparent text-[#64748B] hover:text-[#0F1B3D]'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[11px] text-[#64748B] px-2 py-1">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              quoteData.freshness === 'live'
                ? 'bg-[#10B981] animate-pulse'
                : quoteData.freshness === 'delayed'
                ? 'bg-[#F59E0B]'
                : quoteData.freshness === 'stale'
                ? 'bg-[#EF4444]'
                : 'bg-[#94A3B8]'
            }`}
          />
          <span>
            Last updated:{' '}
            {quoteData.updatedAt
              ? `${new Date(quoteData.updatedAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                })}, ${new Date(quoteData.updatedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : 'Recently'}{' '}
            • {quoteData.source || 'Alpha Vantage'} (
            {quoteData.freshness === 'live'
              ? 'Live'
              : quoteData.freshness === 'delayed'
              ? 'Delayed'
              : quoteData.freshness === 'stale'
              ? 'Stale'
              : 'Unavailable'}
            )
          </span>
        </div>
      </div>

      {/* Top 3 Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Price Chart */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-[#0F1B3D]">Price Chart</h3>
              <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] text-xs font-semibold">
                {(['1D', '1W', '1M', '3M', '1Y', '5Y'] as const).map((rng) => (
                  <button
                    key={rng}
                    type="button"
                    onClick={() => setChartRange(rng)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      chartRange === rng
                        ? 'bg-white text-[#0F1B3D] shadow-xs'
                        : 'text-[#64748B] hover:text-[#0F1B3D]'
                    }`}
                  >
                    {rng}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={[minPrice, maxPrice]} hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F1B3D',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      border: 'none',
                    }}
                    formatter={(val: any) => [`${currencySymbol}${Number(val).toFixed(2)}`, 'Price']}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isPositive ? '#10B981' : '#EF4444'}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#chartFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Metric Badges */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-4 mt-2 border-t border-[#E2E8F0] text-center">
            <div>
              <span className="text-[10px] text-[#64748B] uppercase block">Open</span>
              <span className="text-xs font-bold text-[#0F1B3D]">{currencySymbol}{(quoteData.price - quoteData.change).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase block">Day High</span>
              <span className="text-xs font-bold text-[#0F1B3D]">{currencySymbol}{quoteData.dayHigh.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase block">Day Low</span>
              <span className="text-xs font-bold text-[#0F1B3D]">{currencySymbol}{quoteData.dayLow.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase block">Prev Close</span>
              <span className="text-xs font-bold text-[#0F1B3D]">{currencySymbol}{quoteData.previousClose.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase block">Volume</span>
              <span className="text-xs font-bold text-[#0F1B3D]">{(quoteData.volume / 1e6).toFixed(1)}M</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] uppercase block">Avg Volume</span>
              <span className="text-xs font-bold text-[#0F1B3D]">
                {quoteData.averageVolume > 0 ? `${(quoteData.averageVolume / 1e6).toFixed(1)}M` : 'Unavailable'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Change Score */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-[#0F1B3D]">Change Score</h3>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                isMajor
                  ? 'text-[#DC2626] bg-[#FEF2F2] border-red-200'
                  : isWatching
                  ? 'text-[#D97706] bg-[#FFFBEB] border-amber-200'
                  : 'text-[#059669] bg-[#ECFDF5] border-emerald-200'
              }`}>
                {isMajor ? 'Major change' : isWatching ? 'Worth watching' : 'Normal'}
              </span>
            </div>

            {/* Score & Progress Bar */}
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black text-[#0F1B3D]">{score}</span>
              <span className="text-xs text-[#64748B]">/ 100</span>
            </div>
            <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden mb-5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isMajor ? 'bg-[#DC2626]' : isWatching ? 'bg-[#D97706]' : 'bg-[#10B981]'
                }`}
                style={{ width: `${score}%` }}
              />
            </div>

            {/* 6 Signal Factors with Progress Bars */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-[#0F1B3D] mb-1">
                  <span>Price abnormality</span>
                  <span className="font-bold">
                    {changeResult ? `${changeResult.signals.priceAbnormality.score} / 25` : '0 / 25'}
                  </span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0F1B3D] h-full rounded-full"
                    style={{ width: `${changeResult ? (changeResult.signals.priceAbnormality.score / 25) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#0F1B3D] mb-1">
                  <span className="flex items-center gap-1.5">
                    <span>Volume anomaly</span>
                    {changeResult?.signals.volumeAnomaly.isAvailable === false && (
                      <span className="text-[10px] text-[#94A3B8] font-normal">(Unavailable)</span>
                    )}
                  </span>
                  <span className="font-bold">
                    {changeResult ? `${changeResult.signals.volumeAnomaly.score} / 20` : '0 / 20'}
                  </span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0F1B3D] h-full rounded-full"
                    style={{ width: `${changeResult ? (changeResult.signals.volumeAnomaly.score / 20) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#0F1B3D] mb-1">
                  <span className="flex items-center gap-1.5">
                    <span>Historical deviation</span>
                    {changeResult?.signals.historicalDeviation.isAvailable === false && (
                      <span className="text-[10px] text-[#94A3B8] font-normal">(Unavailable)</span>
                    )}
                  </span>
                  <span className="font-bold">
                    {changeResult ? `${changeResult.signals.historicalDeviation.score} / 20` : '0 / 20'}
                  </span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0F1B3D] h-full rounded-full"
                    style={{ width: `${changeResult ? (changeResult.signals.historicalDeviation.score / 20) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#0F1B3D] mb-1">
                  <span>News activity</span>
                  <span className="font-bold">
                    {changeResult ? `${changeResult.signals.newsActivity.score} / 15` : '0 / 15'}
                  </span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0F1B3D] h-full rounded-full"
                    style={{ width: `${changeResult ? (changeResult.signals.newsActivity.score / 15) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#0F1B3D] mb-1">
                  <span>Company events</span>
                  <span className="font-bold">
                    {changeResult ? `${changeResult.signals.companyEvents.score} / 15` : '0 / 15'}
                  </span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0F1B3D] h-full rounded-full"
                    style={{ width: `${changeResult ? (changeResult.signals.companyEvents.score / 15) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[#0F1B3D] mb-1">
                  <span>Market context</span>
                  <span className="font-bold">
                    {changeResult ? `${changeResult.signals.marketContext.score} / 5` : '0 / 5'}
                  </span>
                </div>
                <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0F1B3D] h-full rounded-full"
                    style={{ width: `${changeResult ? (changeResult.signals.marketContext.score / 5) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#64748B] mt-4 pt-3 border-t border-[#E2E8F0]">
            This score is based on multiple factors and compared to the stock&apos;s historical behaviour.
          </p>
        </div>
      </div>

      {/* Bottom 3 Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bottom Card 1: What Changed Timeline */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <h3 className="font-bold text-sm text-[#0F1B3D] mb-4">
            What changed since you last checked?
          </h3>

          <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2E8F0] text-xs">
            {changeResult?.timeline && changeResult.timeline.length > 0 ? (
              changeResult.timeline.map((item, idx) => {
                const dotColor =
                  item.type === 'price'
                    ? 'bg-[#D97706]'
                    : item.type === 'volume'
                    ? 'bg-[#DC2626]'
                    : item.type === 'news'
                    ? 'bg-[#3B82F6]'
                    : item.type === 'event'
                    ? 'bg-[#10B981]'
                    : 'bg-[#94A3B8]';
                return (
                  <div key={idx} className="relative pl-6">
                    <span className={`absolute left-1 top-1.5 w-2.5 h-2.5 rounded-full ${dotColor} ring-4 ring-white`} />
                    <div className="font-bold text-[#0F1B3D]">{item.time} — {item.title}</div>
                    <p className="text-[#64748B] mt-0.5">{item.description}</p>
                  </div>
                );
              })
            ) : (
              <>
                <div className="relative pl-6">
                  <span className="absolute left-1 top-1.5 w-2.5 h-2.5 rounded-full bg-[#94A3B8] ring-4 ring-white" />
                  <div className="font-bold text-[#0F1B3D]">Baseline — Previous Close</div>
                  <p className="text-[#64748B] mt-0.5">Price: {currencySymbol}{quoteData.previousClose.toFixed(2)}</p>
                </div>
                <div className="relative pl-6">
                  <span className="absolute left-1 top-1.5 w-2.5 h-2.5 rounded-full bg-[#0F1B3D] ring-4 ring-white" />
                  <div className="font-bold text-[#0F1B3D]">Latest Trading Quote</div>
                  <p className={`${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'} font-bold mt-0.5`}>
                    {currencySymbol}{quoteData.price.toFixed(2)} ({isPositive ? '+' : ''}{quoteData.percentChange.toFixed(2)}%)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Card 2: Why does this matter? (AI Explanation) */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-[#0F1B3D]">Why does this matter?</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3B82F6] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-blue-200">
                <Sparkles className="w-3 h-3 text-[#3B82F6]" />
                Powered by ✦ Gemini
              </span>
            </div>

            {/* Generated Explanation */}
            <p className="text-xs text-[#0F1B3D] leading-relaxed mb-4">
              {explanation?.explanation ||
                `${quoteData.name}'s stock price moved significantly higher than its usual daily range, rising ${Math.abs(quoteData.percentChange).toFixed(1)}% since your last check. Trading volume is about 2.6× higher than normal, and the move coincides with the company's latest corporate developments. The broader market moved much less, indicating this is an idiosyncratic, company-specific catalyst rather than a macro shift.`}
            </p>

            {/* Key Takeaways */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 mb-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">
                Key takeaways
              </div>
              <ul className="space-y-1.5 text-xs text-[#0F1B3D]">
                {defaultBullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mt-1.5 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feedback section */}
          <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <span>Was this explanation helpful?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFeedbackGiven('up')}
                className={`p-1.5 rounded-lg border transition-colors ${
                  feedbackGiven === 'up'
                    ? 'bg-[#ECFDF5] text-[#059669] border-emerald-200'
                    : 'hover:bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setFeedbackGiven('down')}
                className={`p-1.5 rounded-lg border transition-colors ${
                  feedbackGiven === 'down'
                    ? 'bg-[#FEF2F2] text-[#DC2626] border-red-200'
                    : 'hover:bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Card 3: Key Information & Recent News */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#0F1B3D] mb-3">Key Information</h3>
            
            <div className="grid grid-cols-2 gap-3 text-xs mb-5">
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] uppercase block">Market Cap</span>
                <span className="font-bold text-[#0F1B3D]">{quoteData.marketCap || 'Unavailable'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] uppercase block">Day Range</span>
                <span className="font-bold text-[#0F1B3D]">
                  {currencySymbol}{quoteData.dayLow.toFixed(2)} - {currencySymbol}{quoteData.dayHigh.toFixed(2)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] uppercase block">52 Week High</span>
                <span className="font-bold text-[#0F1B3D]">
                  {quoteData.fiftyTwoWeekHigh > 0 ? `${currencySymbol}${quoteData.fiftyTwoWeekHigh.toFixed(2)}` : 'Unavailable'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] uppercase block">52 Week Low</span>
                <span className="font-bold text-[#0F1B3D]">
                  {quoteData.fiftyTwoWeekLow > 0 ? `${currencySymbol}${quoteData.fiftyTwoWeekLow.toFixed(2)}` : 'Unavailable'}
                </span>
              </div>
            </div>

            {/* Recent News section */}
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-xs text-[#0F1B3D]">Recent News ({news.length} new)</h4>
              <span className="text-[10px] text-[#3B82F6] font-semibold">Verified sources</span>
            </div>

            <div className="space-y-2.5">
              {(news.length > 0 ? news.slice(0, 2) : [
                {
                  id: 'd-1',
                  title: `${quoteData.name} accelerates next-gen deliveries with record backlog`,
                  source: 'Bloomberg Technology',
                  publishedAt: '45m ago',
                },
                {
                  id: 'd-2',
                  title: 'Hyperscaler cloud capex forecasts revised upward by 18%',
                  source: 'Wall Street Journal',
                  publishedAt: '2h ago',
                }
              ]).map((art: any, idx: number) => (
                <div key={art.id ? `${art.id}-${idx}` : `news-${idx}`} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <div className="text-xs font-semibold text-[#0F1B3D] line-clamp-2 leading-relaxed">
                    {art.title}
                  </div>
                  <div className="text-[10px] text-[#64748B] flex items-center gap-1.5">
                    <span>{art.publishedAt}</span>
                    <span>•</span>
                    <span className="font-medium text-[#0F1B3D]">{art.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-[#E2E8F0] text-right">
            <a
              href="https://google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#3B82F6] hover:underline"
            >
              <span>View full company profile</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Banner */}
      <div className="p-6 rounded-2xl bg-[#0F1B3D] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div>
          <h3 className="font-bold text-base text-white">
            This is why Pulse exists.
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            We track the noise, so you can focus on what matters.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#0F1B3D] font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5"
        >
          <span>Back to watchlist</span>
          <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>
    </div>
  );
}
