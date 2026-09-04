import { useState } from 'react';
import { Settings, Shield, Bell, Sliders, RefreshCw, Check, User } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';

interface SettingsViewProps {
  user: FirebaseUser | null;
  onResetDemo: () => void;
}

export function SettingsView({ user, onResetDemo }: SettingsViewProps) {
  const [sensitivity, setSensitivity] = useState<'balanced' | 'sensitive' | 'conservative'>('balanced');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [volumeSpikes, setVolumeSpikes] = useState(true);
  const [earningsAlerts, setEarningsAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-bold text-[#0F1B3D] tracking-tight">Account & Preferences</h1>
        <p className="text-xs text-[#64748B] mt-1">
          Customize alert sensitivities, baseline criteria, and account parameters.
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#0F1B3D] flex items-center gap-2">
          <User className="w-4 h-4 text-[#3B82F6]" />
          <span>Profile Details</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-[#64748B] mb-1">Display Name</label>
            <input
              type="text"
              readOnly
              value={user?.displayName || 'Ananya'}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#0F1B3D] font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#64748B] mb-1">Email Address</label>
            <input
              type="text"
              readOnly
              value={user?.email || 'ananya@example.com'}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2 text-[#0F1B3D] font-medium"
            />
          </div>
        </div>
      </div>

      {/* Engine Sensitivity Settings */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#0F1B3D] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#3B82F6]" />
          <span>Change Engine Sensitivity</span>
        </h2>
        <p className="text-xs text-[#64748B]">
          Adjust the statistical deviation threshold for classifying a move as a &quot;Major Change&quot;.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'conservative', title: 'Conservative', desc: 'Alert only on extreme moves (>3.5σ)' },
            { id: 'balanced', title: 'Balanced (Recommended)', desc: 'Standard deviation threshold (2.5σ - 3.0σ)' },
            { id: 'sensitive', title: 'High Sensitivity', desc: 'Alert on moderate deviations (>2.0σ)' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSensitivity(opt.id as any)}
              className={`p-4 rounded-xl border text-left transition-all ${
                sensitivity === opt.id
                  ? 'border-[#0F1B3D] bg-[#EFF6FF]'
                  : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
              }`}
            >
              <div className="text-xs font-bold text-[#0F1B3D]">{opt.title}</div>
              <div className="text-[11px] text-[#64748B] mt-1">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#0F1B3D] flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#3B82F6]" />
          <span>Notification Triggers</span>
        </h2>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer">
            <div>
              <div className="font-semibold text-[#0F1B3D]">Digest Email on Major Change</div>
              <div className="text-[11px] text-[#64748B]">Receive an instant summary when a watchlist asset crosses 75 Change Score.</div>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-[#0F1B3D] focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer">
            <div>
              <div className="font-semibold text-[#0F1B3D]">Unusual Volume Alerts</div>
              <div className="text-[11px] text-[#64748B]">Highlight tickers trading at 2.5× their historical daily average volume.</div>
            </div>
            <input
              type="checkbox"
              checked={volumeSpikes}
              onChange={(e) => setVolumeSpikes(e.target.checked)}
              className="w-4 h-4 rounded text-[#0F1B3D] focus:ring-0"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer">
            <div>
              <div className="font-semibold text-[#0F1B3D]">Earnings & Corporate Disclosures</div>
              <div className="text-[11px] text-[#64748B]">Immediate flag when verified quarterly results or regulatory filings post.</div>
            </div>
            <input
              type="checkbox"
              checked={earningsAlerts}
              onChange={(e) => setEarningsAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-[#0F1B3D] focus:ring-0"
            />
          </label>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onResetDemo}
          className="text-xs font-semibold text-[#64748B] hover:text-[#0F1B3D] flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Watchlist Baselines</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2 rounded-xl bg-[#0F1B3D] hover:bg-[#18264D] text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
        >
          {saved ? <Check className="w-4 h-4 text-[#10B981]" /> : null}
          <span>{saved ? 'Preferences Saved' : 'Save Preferences'}</span>
        </button>
      </div>
    </div>
  );
}
