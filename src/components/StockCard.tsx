import { ArrowUpRight, ArrowDownRight, ChevronRight, HelpCircle, Check, Trash2, AlertCircle } from 'lucide-react';
import { ScoreBadge } from './ScoreBadge';
import type { WatchlistItemWithChange } from '../types';

interface StockCardProps {
  key?: string | number;
  item: WatchlistItemWithChange;
  onSelect: (ticker: string) => void;
  onAskWhy: (ticker: string) => void;
  onMarkSeen: (ticker: string) => void;
  onRemove: (ticker: string) => void;
}

export function StockCard({
  item,
  onSelect,
  onAskWhy,
  onMarkSeen,
  onRemove,
}: StockCardProps) {
  const { stock, changeResult, userState, percentDeltaSinceLastSeen, priceDeltaSinceLastSeen } = item;
  const isPositiveDaily = stock.change >= 0;
  const isPositiveSinceSeen = priceDeltaSinceLastSeen >= 0;
  const isMajor = changeResult.classification === 'Major Change';
  const isImportant = changeResult.classification === 'Important';
  const isWatching = changeResult.classification === 'Worth Watching';

  const cardBorder = isMajor
    ? 'border-red-300 ring-1 ring-red-100 shadow-sm'
    : isImportant
    ? 'border-orange-300 ring-1 ring-orange-100 shadow-sm'
    : isWatching
    ? 'border-amber-300 shadow-xs'
    : 'border-[#E5E5E7] hover:border-[#D2D2D7] shadow-xs';

  return (
    <div
      id={`stock-card-${stock.ticker}`}
      className={`rounded-2xl border bg-white p-5 transition-all duration-200 flex flex-col justify-between relative group ${cardBorder}`}
    >
      <div>
        {/* Card Header: Ticker, Name, Badges */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-[#1D1D1F] tracking-tight">
                {stock.ticker}
              </span>
              <span className="text-[11px] font-semibold text-[#86868B] bg-[#F5F5F7] border border-[#E5E5E7] px-2 py-0.5 rounded-md">
                {stock.exchange}
              </span>
              {stock.dataDiscrepancy && (
                <span
                  title={stock.dataDiscrepancy}
                  className="text-[10px] font-bold text-[#B45309] bg-[#FEF3C7] px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3 text-[#F59E0B]" /> Discrepancy
                </span>
              )}
            </div>
            <h4 className="text-xs text-[#86868B] font-medium truncate max-w-[200px] mt-0.5" title={stock.name}>
              {stock.name}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <ScoreBadge
              score={changeResult.totalScore}
              classification={changeResult.classification}
              size="sm"
            />
          </div>
        </div>

        {/* Price & Movement Comparison */}
        <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#E5E5E7] my-3">
          <div>
            <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block mb-0.5">
              Current Price
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-[#1D1D1F]">
                {stock.currency === 'INR' ? '₹' : '$'}{stock.price.toFixed(2)}
              </span>
              <span
                className={`text-xs font-bold inline-flex items-center ${
                  isPositiveDaily ? 'text-[#24A148]' : 'text-[#E01414]'
                }`}
              >
                {isPositiveDaily ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {isPositiveDaily ? '+' : ''}{stock.percentChange.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Since You Last Checked */}
          <div className="pl-3 border-l border-[#E5E5E7]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D1D1F] block mb-0.5">
              Since Last Visit
            </span>
            {userState ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-medium text-[#86868B] line-through">
                  {stock.currency === 'INR' ? '₹' : '$'}{userState.lastSeenPrice.toFixed(2)}
                </span>
                <span className="text-xs text-[#86868B] font-mono">→</span>
                <span
                  className={`text-xs font-black ${
                    isPositiveSinceSeen ? 'text-[#24A148]' : 'text-[#E01414]'
                  }`}
                >
                  {isPositiveSinceSeen ? '+' : ''}{percentDeltaSinceLastSeen.toFixed(2)}%
                </span>
              </div>
            ) : (
              <span className="text-xs text-[#86868B] italic">Baseline recorded</span>
            )}
          </div>
        </div>

        {/* Deterministic Signals Evidence Box */}
        <div className="bg-[#FAFAFB] border border-[#E5E5E7] rounded-xl p-3 my-3">
          <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block mb-1.5">
            Key Signals &amp; Why It Matters:
          </span>
          <ul className="space-y-1">
            {changeResult.summaryBullets.slice(0, 3).map((bullet, idx) => (
              <li key={idx} className="text-xs text-[#1D1D1F] flex items-start gap-1.5 leading-relaxed">
                <span className="text-[#1D1D1F] text-xs mt-0.5 font-bold">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-3 border-t border-[#E5E5E7] flex items-center justify-between gap-2 mt-2">
        <div className="flex items-center gap-1.5">
          <button
            id={`btn-why-${stock.ticker}`}
            type="button"
            onClick={() => onAskWhy(stock.ticker)}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#1D1D1F] text-white hover:bg-black transition-colors shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Why?</span>
          </button>

          <button
            id={`btn-mark-seen-${stock.ticker}`}
            type="button"
            onClick={() => onMarkSeen(stock.ticker)}
            title="Mark this stock as acknowledged (updates your baseline to current price)"
            className="p-1.5 rounded-xl text-[#86868B] hover:text-[#24A148] hover:bg-[#DCFCE7] border border-[#E5E5E7] transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </button>

          <button
            id={`btn-remove-${stock.ticker}`}
            type="button"
            onClick={() => onRemove(stock.ticker)}
            title="Remove from watchlist"
            className="p-1.5 rounded-xl text-[#86868B] hover:text-[#E01414] hover:bg-[#FEE2E2] border border-[#E5E5E7] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          id={`btn-view-${stock.ticker}`}
          type="button"
          onClick={() => onSelect(stock.ticker)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1D1D1F] hover:bg-[#F5F5F7] px-3 py-1.5 rounded-xl border border-[#E5E5E7] transition-colors"
        >
          <span>Deep Dive</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
