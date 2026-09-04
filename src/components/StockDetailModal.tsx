import { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Calendar, 
  RefreshCw, 
  CheckCircle2,
  ExternalLink 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { ScoreBadge } from './ScoreBadge';
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

interface StockDetailModalProps {
  ticker: string;
  onClose: () => void;
  userState?: UserStockState;
  onMarkSeen: (ticker: string) => void;
}

export function StockDetailModal({
  ticker,
  onClose,
  userState,
  onMarkSeen,
}: StockDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'news' | 'events'>('overview');
  const [chartRange, setChartRange] = useState<'1D' | '1W' | '1M' | '3M'>('1D');
  const [quoteData, setQuoteData] = useState<StockQuote | null>(null);
  const [changeResult, setChangeResult] = useState<MeaningfulChangeResult | null>(null);
  const [history, setHistory] = useState<StockHistory | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [events, setEvents] = useState<StockEvent[]>([]);
  const [explanation, setExplanation] = useState<AiExplanationResponse | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoadingInitial(true);
      const [quoteRes, changeRes, histRes] = await Promise.all([
        apiClient.getStockQuote(ticker),
        fetch(`/api/stocks/${ticker}/changes`).then((r) => r.json()),
        apiClient.getStockHistory(ticker, chartRange),
      ]);

      if (isMounted) {
        if (quoteRes) {
          setQuoteData(quoteRes.quote);
          setNews(quoteRes.news || []);
          setEvents(quoteRes.events || []);
        }
        if (changeRes?.changeResult) {
          setChangeResult(changeRes.changeResult);
        }
        if (histRes) {
          setHistory(histRes);
        }
        setLoadingInitial(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [ticker]);

  useEffect(() => {
    let isMounted = true;
    apiClient.getStockHistory(ticker, chartRange).then((h) => {
      if (isMounted && h) setHistory(h);
    });
    return () => {
      isMounted = false;
    };
  }, [ticker, chartRange]);

  const fetchAiExplanation = async () => {
    setLoadingAi(true);
    const res = await apiClient.explainChange(ticker, userState);
    if (res) {
      setExplanation(res);
    }
    setLoadingAi(false);
  };

  // Auto-fetch AI explanation on modal open
  useEffect(() => {
    fetchAiExplanation();
  }, [ticker]);

  if (loadingInitial || !quoteData || !changeResult) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white border border-[#E5E5E7] rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="w-8 h-8 border-2 border-[#1D1D1F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#1D1D1F] text-sm font-medium">Gathering deterministic evidence for {ticker}...</p>
        </div>
      </div>
    );
  }

  const isPositive = quoteData.change >= 0;
  const signals = changeResult.signals;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        id="stock-detail-modal"
        className="bg-white border border-[#E5E5E7] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E7] flex items-center justify-between gap-4 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-[#1D1D1F] tracking-tight">{quoteData.ticker}</h2>
                <span className="text-xs px-2 py-0.5 rounded-md bg-[#F5F5F7] text-[#86868B] font-semibold border border-[#E5E5E7]">
                  {quoteData.exchange}
                </span>
                <ScoreBadge
                  score={changeResult.totalScore}
                  classification={changeResult.classification}
                  size="md"
                />
              </div>
              <p className="text-xs text-[#86868B] mt-0.5 font-medium">{quoteData.name} • {quoteData.sector}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xl font-black text-[#1D1D1F]">
                {quoteData.currency === 'INR' ? '₹' : '$'}{quoteData.price.toFixed(2)}
              </div>
              <div
                className={`text-xs font-bold flex items-center justify-end ${
                  isPositive ? 'text-[#24A148]' : 'text-[#E01414]'
                }`}
              >
                {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                {isPositive ? '+' : ''}{quoteData.percentChange.toFixed(2)}% ({isPositive ? '+' : ''}{quoteData.change.toFixed(2)})
              </div>
            </div>

            <button
              id="modal-btn-close"
              type="button"
              onClick={onClose}
              className="p-2 text-[#86868B] hover:text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7] transition-colors ml-2 border border-[#E5E5E7]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-[#E5E5E7] bg-white flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-[#1D1D1F] text-[#1D1D1F]'
                : 'border-transparent text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            Overview & Score Breakdown
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'timeline'
                ? 'border-[#1D1D1F] text-[#1D1D1F]'
                : 'border-transparent text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            What Changed? Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'news'
                ? 'border-[#1D1D1F] text-[#1D1D1F]'
                : 'border-transparent text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            News ({news.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'events'
                ? 'border-[#1D1D1F] text-[#1D1D1F]'
                : 'border-transparent text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            Corporate Events ({events.length})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAFAFB]">
          {/* AI Explanation Card */}
          <div className="bg-white border border-[#D1DBFF] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#4338CA]">
                  Why does this matter?
                </h3>
                <span className="text-[10px] font-bold uppercase bg-[#EEF2FF] text-[#4F46E5] px-2 py-0.5 rounded-full border border-[#D1DBFF]">
                  AI Grounded in Structured Evidence
                </span>
              </div>
              <button
                type="button"
                onClick={fetchAiExplanation}
                disabled={loadingAi}
                className="text-xs text-[#4F46E5] hover:text-[#3730A3] flex items-center gap-1 font-semibold disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loadingAi ? 'animate-spin' : ''}`} />
                <span>Refresh Analysis</span>
              </button>
            </div>

            {loadingAi ? (
              <div className="py-4 text-xs text-[#86868B] flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
                <span>Synthesizing mathematical evidence with Gemini...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[#1D1D1F] leading-relaxed font-normal">
                  {explanation?.explanation}
                </p>
                {explanation?.warningNotice && (
                  <div className="text-[11px] font-medium text-[#B45309] bg-[#FEF3C7] px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5 mt-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#F59E0B]" />
                    <span>{explanation.warningNotice}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] text-[#86868B] pt-2 border-t border-[#E5E5E7] mt-2">
                  <span>Engine: {explanation?.modelUsed || 'Gemini 2.5 Flash'}</span>
                  <span>Data Source: {quoteData.source}</span>
                </div>
              </div>
            )}
          </div>

          {activeTab === 'overview' && (
            <>
              {/* Interactive Price Chart */}
              <div className="bg-white border border-[#E5E5E7] rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-[#86868B]" />
                    <span className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider">Price Action</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#F5F5F7] p-0.5 rounded-lg border border-[#E5E5E7]">
                    {(['1D', '1W', '1M', '3M'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setChartRange(r)}
                        className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                          chartRange === r
                            ? 'bg-[#1D1D1F] text-white shadow-xs'
                            : 'text-[#86868B] hover:text-[#1D1D1F]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-56 w-full">
                  {history && history.points.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history.points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isPositive ? '#24A148' : '#E01414'} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={isPositive ? '#24A148' : '#E01414'} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="timestamp" stroke="#86868B" fontSize={11} tickLine={false} />
                        <YAxis
                          domain={['auto', 'auto']}
                          stroke="#86868B"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(val) => `$${val}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderColor: '#E5E5E7',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: '#1D1D1F',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                          }}
                          formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Price']}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={isPositive ? '#24A148' : '#E01414'}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#chartGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-[#86868B]">
                      Loading chart telemetry...
                    </div>
                  )}
                </div>
              </div>

              {/* Deterministic Change Score Breakdown */}
              <div className="bg-white border border-[#E5E5E7] rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#1D1D1F]">
                      Deterministic Change Score Breakdown
                    </h3>
                    <p className="text-xs text-[#86868B]">
                      Calculated mathematically across 6 weighted signals.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#1D1D1F]">
                      {changeResult.totalScore}
                    </span>
                    <span className="text-xs text-[#86868B] font-semibold"> / 100</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Signal 1: Price Abnormality */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#1D1D1F] font-semibold">
                        Price Abnormality ({signals.priceAbnormality.score}/{signals.priceAbnormality.max} pts)
                      </span>
                      <span className="text-[#86868B] font-mono text-[11px]">
                        {signals.priceAbnormality.label}
                      </span>
                    </div>
                    <div className="w-full bg-[#E5E5E7] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#1D1D1F] h-2 rounded-full"
                        style={{
                          width: `${(signals.priceAbnormality.score / signals.priceAbnormality.max) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Signal 2: Volume Anomaly */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#1D1D1F] font-semibold">
                        Volume Anomaly ({signals.volumeAnomaly.score}/{signals.volumeAnomaly.max} pts)
                      </span>
                      <span className="text-[#86868B] font-mono text-[11px]">
                        {signals.volumeAnomaly.label}
                      </span>
                    </div>
                    <div className="w-full bg-[#E5E5E7] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#24A148] h-2 rounded-full"
                        style={{
                          width: `${(signals.volumeAnomaly.score / signals.volumeAnomaly.max) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Signal 3: Historical Deviation */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#1D1D1F] font-semibold">
                        Historical Deviation ({signals.historicalDeviation.score}/{signals.historicalDeviation.max} pts)
                      </span>
                      <span className="text-[#86868B] font-mono text-[11px]">
                        {signals.historicalDeviation.label}
                      </span>
                    </div>
                    <div className="w-full bg-[#E5E5E7] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#4F46E5] h-2 rounded-full"
                        style={{
                          width: `${(signals.historicalDeviation.score / signals.historicalDeviation.max) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Signal 4: News Activity */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#1D1D1F] font-semibold">
                        News Velocity ({signals.newsActivity.score}/{signals.newsActivity.max} pts)
                      </span>
                      <span className="text-[#86868B] font-mono text-[11px]">
                        {signals.newsActivity.label}
                      </span>
                    </div>
                    <div className="w-full bg-[#E5E5E7] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#F59E0B] h-2 rounded-full"
                        style={{
                          width: `${(signals.newsActivity.score / signals.newsActivity.max) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Signal 5: Company Events */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#1D1D1F] font-semibold">
                        Corporate Events ({signals.companyEvents.score}/{signals.companyEvents.max} pts)
                      </span>
                      <span className="text-[#86868B] font-mono text-[11px]">
                        {signals.companyEvents.label}
                      </span>
                    </div>
                    <div className="w-full bg-[#E5E5E7] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#E01414] h-2 rounded-full"
                        style={{
                          width: `${(signals.companyEvents.score / signals.companyEvents.max) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Signal 6: Market Context */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#1D1D1F] font-semibold">
                        Market Context Divergence ({signals.marketContext.score}/{signals.marketContext.max} pts)
                      </span>
                      <span className="text-[#86868B] font-mono text-[11px]">
                        {signals.marketContext.label}
                      </span>
                    </div>
                    <div className="w-full bg-[#E5E5E7] rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#24A148] h-2 rounded-full"
                        style={{
                          width: `${(signals.marketContext.score / signals.marketContext.max) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'timeline' && (
            <div className="bg-white border border-[#E5E5E7] rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-[#1D1D1F] mb-4">
                What Changed Since You Last Checked
              </h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#E5E5E7]">
                {changeResult.timeline.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-4 pl-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border text-[11px] font-bold z-10 ${
                        step.isKeyMilestone
                          ? 'bg-[#1D1D1F] border-[#1D1D1F] text-white'
                          : 'bg-white border-[#D2D2D7] text-[#86868B]'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 bg-[#FAFAFB] border border-[#E5E5E7] rounded-xl p-3.5">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-[#1D1D1F]">{step.time}</span>
                        {step.price && (
                          <span className="font-mono text-[#1D1D1F] font-bold">
                            ${step.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#1D1D1F] leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            <div className="space-y-3">
              {news.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#86868B]">
                  No high-relevance news articles logged in current cycle.
                </div>
              ) : (
                news.map((n, idx) => (
                  <div
                    key={n.id ? `${n.id}-${idx}` : `news-${idx}`}
                    className="bg-white border border-[#E5E5E7] rounded-xl p-4 hover:border-[#D2D2D7] transition-colors shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug">
                        {n.title}
                      </h4>
                      <ExternalLink className="w-3.5 h-3.5 text-[#86868B] shrink-0 mt-1" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#86868B] mt-2 font-medium">
                      <span>{n.source}</span>
                      <span>•</span>
                      <span>{new Date(n.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span className="text-[#4F46E5] font-semibold">Relevance: {Math.round(n.relevance * 100)}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#86868B]">
                  No major corporate events (earnings, guidance, filings) detected in the active window.
                </div>
              ) : (
                events.map((e) => (
                  <div
                    key={e.id}
                    className="bg-white border border-[#E5E5E7] rounded-xl p-4 shadow-xs"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#E01414] bg-[#FEE2E2] px-2 py-0.5 rounded-full border border-red-200">
                        {e.type}
                      </span>
                      <span className="text-xs text-[#86868B] font-medium">
                        {new Date(e.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#1D1D1F] mb-1">{e.title}</h4>
                    <p className="text-xs text-[#1D1D1F] leading-relaxed">{e.description}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5E5E7] bg-white flex items-center justify-between text-xs text-[#86868B]">
          <div className="flex items-center gap-2 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#86868B]" />
            <span>Updated {new Date(quoteData.updatedAt).toLocaleTimeString()} ({quoteData.freshness})</span>
          </div>
          <button
            id="modal-btn-mark-seen"
            type="button"
            onClick={() => {
              onMarkSeen(ticker);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D1D1F] text-white hover:bg-black font-semibold transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#24A148]" />
            <span>Mark as Acknowledged</span>
          </button>
        </div>
      </div>
    </div>
  );
}
