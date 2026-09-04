import { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, Zap, ArrowRight, ShieldCheck, PieChart, Layers } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface InsightsViewProps {
  onSelectStock: (ticker: string) => void;
}

export function InsightsView({ onSelectStock }: InsightsViewProps) {
  const [sectors, setSectors] = useState<any[]>([]);
  const [indices, setIndices] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const [secRes, idxRes] = await Promise.all([
        apiClient.getMarketSectors(),
        apiClient.getMarketOverview(),
      ]);
      if (secRes?.sectors) setSectors(secRes.sectors);
      if (idxRes?.indices) setIndices(idxRes.indices);
    }
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1B3D] tracking-tight">Market Insights & Analytics</h1>
        <p className="text-xs text-[#64748B] mt-1">
          Deep-dive telemetry into sector momentum, macro liquidity, and statistical market signals.
        </p>
      </div>

      {/* 3 Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B] mb-2">
            <span>Market Regime</span>
            <span className="text-[#10B981] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-emerald-200">
              Risk-On
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#0F1B3D]">Bullish Breadth</div>
          <p className="text-xs text-[#64748B] mt-1">
            78% of benchmark index components trading above 20-day moving average.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B] mb-2">
            <span>Average Volatility</span>
            <span className="text-[#3B82F6] bg-[#EFF6FF] px-2 py-0.5 rounded-md border border-blue-200">
              14.2 VIX
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#0F1B3D]">Moderate Vol</div>
          <p className="text-xs text-[#64748B] mt-1">
            Implied volatility ranks in the 32nd percentile across 12-month window.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#64748B] mb-2">
            <span>Active Catalysts</span>
            <span className="text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded-md border border-amber-200">
              Earnings Cycle
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#0F1B3D]">Quarterly Releases</div>
          <p className="text-xs text-[#64748B] mt-1">
            High clustering of tech and banking earnings scheduled this calendar fortnight.
          </p>
        </div>
      </div>

      {/* Sector Momentum Table & Engine Explainer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Momentum */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#0F1B3D]">Sector Performance Breakdown</h2>
          
          <div className="space-y-3">
            {sectors.map((sec) => {
              const isPos = sec.percentChange >= 0;
              return (
                <div key={sec.name} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0F1B3D]">{sec.name}</span>
                    <span className={`font-bold ${isPos ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {isPos ? '+' : ''}{sec.percentChange}%
                    </span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isPos ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
                      style={{ width: `${Math.min(Math.abs(sec.percentChange) * 20, 100)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-[#64748B] flex justify-between">
                    <span>Key Driver: {sec.leader}</span>
                    <span className="font-medium text-[#0F1B3D]">Daily Pulse</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* How Pulse Quantifies Meaningful Change */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0F1B3D]">How Pulse Quantifies What Matters</h2>
            <p className="text-xs text-[#64748B] leading-relaxed mt-1">
              Pulse eliminates market noise through a proprietary multi-factor classification framework:
            </p>

            <div className="space-y-3 mt-4 text-xs">
              <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="font-bold text-[#0F1B3D]">1. Statistical Volatility Multipliers (3.0σ)</div>
                <p className="text-[#64748B] mt-0.5 leading-relaxed">
                  Price changes are evaluated against each stock’s specific 90-day daily standard deviation rather than arbitrary flat percentages.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="font-bold text-[#0F1B3D]">2. Institutional Volume Multipliers (2.5×)</div>
                <p className="text-[#64748B] mt-0.5 leading-relaxed">
                  High price moves on low volume are downranked as noise. Movements accompanied by 2.5× typical average volume receive high priority scores.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="font-bold text-[#0F1B3D]">3. Deterministic Catalyst Alignment</div>
                <p className="text-[#64748B] mt-0.5 leading-relaxed">
                  Earnings announcements, analyst revisions, regulatory notices, and verified wire news are cross-correlated to explain the movement.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
            <span className="text-[#64748B]">Zero hype. Pure evidence.</span>
            <button
              type="button"
              onClick={() => onSelectStock('NVDA')}
              className="text-[#3B82F6] font-bold hover:underline flex items-center gap-1"
            >
              <span>See live case study</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
