import { Activity, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, TrendingUp, BarChart2 } from 'lucide-react';

interface LandingViewProps {
  onSignIn: () => void;
  onInstantDemo: () => void;
}

export function LandingView({ onSignIn, onInstantDemo }: LandingViewProps) {
  return (
    <div id="landing-view" className="py-12 sm:py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-16 animate-in fade-in duration-200">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E2E8F0] text-xs text-[#0F1B3D] font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Next-Generation Market Watchlist</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-[#0F1B3D] tracking-tight leading-tight">
          Know what changed.<br />
          <span className="text-[#3B82F6]">
            Know what matters.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
          Standard watchlists only show prices and percentage changes. Pulse calculates what meaningfully shifted in your personal watchlist since you last checked — and gives you evidence-backed reasons why.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            id="landing-btn-demo"
            type="button"
            onClick={onInstantDemo}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#0F1B3D] hover:bg-[#18264D] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Explore Live Workspace</span>
            <ArrowRight className="w-4 h-4 text-[#10B981]" />
          </button>

          <button
            id="landing-btn-signin"
            type="button"
            onClick={onSignIn}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#0F1B3D] border border-[#E2E8F0] font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <span>Sign In / Create Account</span>
          </button>
        </div>
      </div>

      {/* Normal Watchlist vs. Pulse Comparison */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs">
        <h2 className="text-xl font-bold text-[#0F1B3D] text-center mb-6">
          The Paradigm Shift: Passive Price Feeds vs. Active Intelligence
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Legacy Watchlist */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-[#DC2626] font-bold text-xs uppercase tracking-wider">
              <span>Traditional Stock Watchlist</span>
            </div>
            <div className="text-sm text-[#0F1B3D] font-semibold">
              Asks: &ldquo;What is the current price right now?&rdquo;
            </div>
            <ul className="space-y-2.5 text-xs text-[#64748B]">
              <li className="flex items-start gap-2">
                <span className="text-[#DC2626] font-bold">✕</span>
                <span>Treats any +4% move identically, ignoring that Stock A normally moves ±1% while Stock B normally moves ±5%.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#DC2626] font-bold">✕</span>
                <span>Requires manual memory of what price a stock had when you logged off 4 hours ago.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#DC2626] font-bold">✕</span>
                <span>No volume anomaly or market context normalization.</span>
              </li>
            </ul>
          </div>

          {/* Pulse Watchlist */}
          <div className="bg-white border-2 border-[#0F1B3D] rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-[#0F1B3D] font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Pulse Intelligence Engine</span>
            </div>
            <div className="text-sm text-[#0F1B3D] font-bold">
              Asks: &ldquo;What meaningfully changed since I last checked, and does it matter?&rdquo;
            </div>
            <ul className="space-y-2.5 text-xs text-[#0F1B3D]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span><strong>Personal Baseline:</strong> Remembers your last-seen price and calculates delta specifically since your last check.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span><strong>Deterministic Change Engine:</strong> Evaluates price abnormality (25%), volume anomaly (20%), z-score (20%), news velocity (15%), events (15%), and market divergence (5%).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span><strong>Evidence-Backed Explanations:</strong> Plain-language synthesis explaining the catalyst behind the move.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-[#0F1B3D]">Personalized Time-Traveling</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Every session tracks when you last viewed a stock. When you return, Pulse computes changes relative to your exact previous visit.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center font-bold">
            <BarChart2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-[#0F1B3D]">Mathematical Noise Rejection</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Statistical standard deviations and volume anomalies prevent false alerts on routine market drift.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] text-[#8B5CF6] flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-[#0F1B3D]">Institutional Grade Security</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Personal watchlist data is persisted securely via cloud encryption with real-time sync across devices.
          </p>
        </div>
      </div>
    </div>
  );
}
