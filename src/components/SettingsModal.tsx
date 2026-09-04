import { X, Sliders, ShieldCheck, Database, Trash2, Cpu } from 'lucide-react';
import { CHANGE_ENGINE_WEIGHTS, CHANGE_CLASSIFICATION_THRESHOLDS } from '../config/changeEngineConfig';

interface SettingsModalProps {
  onClose: () => void;
  onResetBaseline: () => void;
}

export function SettingsModal({ onClose, onResetBaseline }: SettingsModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="settings-modal"
        className="bg-white border border-[#E5E5E7] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E7]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#F5F5F7] text-[#1D1D1F] rounded-xl border border-[#E5E5E7]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#1D1D1F]">Engine Configuration</h2>
              <p className="text-xs text-[#86868B]">Mathematical rules driving meaningful change detection</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] rounded-lg hover:bg-[#F5F5F7]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 pt-4">
          {/* Signal Weights Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-[#1D1D1F]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]">
                Signal Weights (Total: 100%)
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#FAFAFB] border border-[#E5E5E7] rounded-xl shadow-2xs">
                <div className="flex justify-between text-[#1D1D1F] font-bold mb-1">
                  <span>Price Abnormality</span>
                  <span className="text-[#1D1D1F] font-black">{CHANGE_ENGINE_WEIGHTS.priceAbnormality}%</span>
                </div>
                <p className="text-[11px] text-[#86868B]">Move size vs historical daily standard volatility</p>
              </div>

              <div className="p-3 bg-[#FAFAFB] border border-[#E5E5E7] rounded-xl shadow-2xs">
                <div className="flex justify-between text-[#1D1D1F] font-bold mb-1">
                  <span>Volume Anomaly</span>
                  <span className="text-[#24A148] font-black">{CHANGE_ENGINE_WEIGHTS.volumeAnomaly}%</span>
                </div>
                <p className="text-[11px] text-[#86868B]">Trading volume vs 30-day average volume multiple</p>
              </div>

              <div className="p-3 bg-[#FAFAFB] border border-[#E5E5E7] rounded-xl shadow-2xs">
                <div className="flex justify-between text-[#1D1D1F] font-bold mb-1">
                  <span>Historical Deviation</span>
                  <span className="text-[#4F46E5] font-black">{CHANGE_ENGINE_WEIGHTS.historicalDeviation}%</span>
                </div>
                <p className="text-[11px] text-[#86868B]">Z-score distance from 30-day historical mean</p>
              </div>

              <div className="p-3 bg-[#FAFAFB] border border-[#E5E5E7] rounded-xl shadow-2xs">
                <div className="flex justify-between text-[#1D1D1F] font-bold mb-1">
                  <span>News Activity</span>
                  <span className="text-[#F59E0B] font-black">{CHANGE_ENGINE_WEIGHTS.newsActivity}%</span>
                </div>
                <p className="text-[11px] text-[#86868B]">Article count velocity and relevance thresholding</p>
              </div>

              <div className="p-3 bg-[#FAFAFB] border border-[#E5E5E7] rounded-xl shadow-2xs">
                <div className="flex justify-between text-[#1D1D1F] font-bold mb-1">
                  <span>Company Events</span>
                  <span className="text-[#E01414] font-black">{CHANGE_ENGINE_WEIGHTS.companyEvents}%</span>
                </div>
                <p className="text-[11px] text-[#86868B]">Earnings, guidance updates, regulatory filings</p>
              </div>

              <div className="p-3 bg-[#FAFAFB] border border-[#E5E5E7] rounded-xl shadow-2xs">
                <div className="flex justify-between text-[#1D1D1F] font-bold mb-1">
                  <span>Market Context</span>
                  <span className="text-[#24A148] font-black">{CHANGE_ENGINE_WEIGHTS.marketContext}%</span>
                </div>
                <p className="text-[11px] text-[#86868B]">Relative divergence from broader benchmark index</p>
              </div>
            </div>
          </div>

          {/* Classification Thresholds */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-[#1D1D1F]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F]">
                Score Classification Thresholds
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-[#DCFCE7] border border-emerald-200 rounded-xl">
                <span className="font-bold text-[#24A148] block uppercase text-[11px]">Normal</span>
                <span className="text-[11px] text-[#1D1D1F] font-mono font-medium">0 – {CHANGE_CLASSIFICATION_THRESHOLDS.normalMax}</span>
              </div>
              <div className="p-2.5 bg-[#FEF3C7] border border-amber-200 rounded-xl">
                <span className="font-bold text-[#B45309] block uppercase text-[11px]">Worth Watching</span>
                <span className="text-[11px] text-[#1D1D1F] font-mono font-medium">{CHANGE_CLASSIFICATION_THRESHOLDS.normalMax + 1} – {CHANGE_CLASSIFICATION_THRESHOLDS.worthWatchingMax}</span>
              </div>
              <div className="p-2.5 bg-[#FFEDD5] border border-orange-200 rounded-xl">
                <span className="font-bold text-[#C2410C] block uppercase text-[11px]">Important</span>
                <span className="text-[11px] text-[#1D1D1F] font-mono font-medium">{CHANGE_CLASSIFICATION_THRESHOLDS.worthWatchingMax + 1} – {CHANGE_CLASSIFICATION_THRESHOLDS.importantMax}</span>
              </div>
              <div className="p-2.5 bg-[#FEE2E2] border border-red-200 rounded-xl">
                <span className="font-bold text-[#E01414] block uppercase text-[11px]">Major Change</span>
                <span className="text-[11px] text-[#1D1D1F] font-mono font-medium">{CHANGE_CLASSIFICATION_THRESHOLDS.importantMax + 1} – 100</span>
              </div>
            </div>
          </div>

          {/* User Baseline & Data Management */}
          <div className="pt-4 border-t border-[#E5E5E7]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#86868B]" />
                  Personal Baseline
                </h4>
                <p className="text-[11px] text-[#86868B]">
                  Reset your last-seen price and volume baseline to current live prices.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onResetBaseline();
                  onClose();
                }}
                className="text-xs px-3.5 py-2 bg-[#F5F5F7] hover:bg-[#E5E5E7] text-[#1D1D1F] border border-[#E5E5E7] rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#E01414]" />
                <span>Reset Baseline</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
