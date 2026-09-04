import { useState } from 'react';
import { Play, RotateCcw, AlertTriangle, Sparkles, CheckCircle2, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface DemoBarProps {
  onScenarioChanged: () => void;
  activeScenarioId?: string | null;
}

export function DemoBar({ onScenarioChanged, activeScenarioId }: DemoBarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTrigger = async (scenarioId: string) => {
    setLoading(scenarioId);
    await apiClient.simulateScenario(scenarioId);
    await onScenarioChanged();
    setLoading(null);
  };

  const handleReset = async () => {
    setLoading('reset');
    await apiClient.resetDemo();
    await onScenarioChanged();
    setLoading(null);
  };

  return (
    <div
      id="scenario-simulator-bar"
      className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-2 sm:px-6 transition-all"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#0F1B3D] text-[#10B981] flex items-center justify-center">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0F1B3D]">
              Market Simulator
            </span>
            <span className="text-[11px] text-[#64748B] hidden md:inline">
              Test dynamic volatility shifts & personal baseline recognition
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick toggle chips */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              id="demo-btn-nvda"
              type="button"
              onClick={() => handleTrigger('nvda_surge')}
              disabled={loading !== null}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 border ${
                activeScenarioId === 'nvda_surge'
                  ? 'bg-[#FEF2F2] text-[#DC2626] border-red-200'
                  : 'bg-white text-[#0F1B3D] border-[#E2E8F0] hover:bg-[#F8FAFC]'
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#10B981]" />
              <span>NVDA Surge (+8.4%)</span>
            </button>

            <button
              id="demo-btn-tsla"
              type="button"
              onClick={() => handleTrigger('tsla_dip')}
              disabled={loading !== null}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 border ${
                activeScenarioId === 'tsla_dip'
                  ? 'bg-[#FFFBEB] text-[#D97706] border-amber-200'
                  : 'bg-white text-[#0F1B3D] border-[#E2E8F0] hover:bg-[#F8FAFC]'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-[#D97706]" />
              <span>TSLA Dip (-5.2%)</span>
            </button>

            <button
              id="demo-btn-quiet"
              type="button"
              onClick={() => handleTrigger('quiet_market')}
              disabled={loading !== null}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 border ${
                activeScenarioId === 'quiet_market'
                  ? 'bg-[#ECFDF5] text-[#059669] border-emerald-200'
                  : 'bg-white text-[#0F1B3D] border-[#E2E8F0] hover:bg-[#F8FAFC]'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
              <span>Quiet Market</span>
            </button>

            <button
              id="demo-btn-reset"
              type="button"
              onClick={handleReset}
              disabled={loading !== null}
              className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-white text-[#64748B] hover:text-[#0F1B3D] border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="sm:hidden p-1.5 text-[#64748B] hover:text-[#0F1B3D] rounded-lg"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile expanded drawer */}
      {isExpanded && (
        <div className="sm:hidden pt-2.5 mt-2 border-t border-[#E2E8F0] flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleTrigger('nvda_surge')}
            className="text-xs px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] font-medium text-[#0F1B3D]"
          >
            NVDA Surge
          </button>
          <button
            type="button"
            onClick={() => handleTrigger('tsla_dip')}
            className="text-xs px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] font-medium text-[#0F1B3D]"
          >
            TSLA Dip
          </button>
          <button
            type="button"
            onClick={() => handleTrigger('quiet_market')}
            className="text-xs px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] font-medium text-[#0F1B3D]"
          >
            Quiet
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] font-medium text-[#64748B]"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
