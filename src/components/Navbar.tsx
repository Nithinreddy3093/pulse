import { Activity, Plus, CheckCheck, Settings as SettingsIcon, LogOut, User as UserIcon } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { MarketFreshness } from '../types';

interface NavbarProps {
  user: User | null;
  freshness: MarketFreshness;
  onOpenSearch: () => void;
  onMarkAllSeen: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  lastCheckedTime?: string | null;
}

export function Navbar({
  user,
  freshness,
  onOpenSearch,
  onMarkAllSeen,
  onOpenSettings,
  onOpenAuth,
  onLogout,
  lastCheckedTime,
}: NavbarProps) {
  const getFreshnessBadge = () => {
    switch (freshness) {
      case 'stale':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E01414] bg-[#FEE2E2] px-2.5 py-0.5 rounded-full border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E01414]"></span>
            Data Stale (&gt;30m)
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B45309] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
            15m Delayed Feed
          </span>
        );
      case 'live':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#24A148] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#24A148] animate-pulse"></span>
            ● LIVE
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E5E7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1D1D1F] flex items-center justify-center text-white shadow-xs">
            <Activity className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl text-[#1D1D1F] tracking-tight">
                PULSE<span className="text-[#E01414]">.</span>
              </span>
              {getFreshnessBadge()}
            </div>
            <p className="text-[11px] text-[#86868B] hidden sm:block">
              Know what changed. Know what matters.
            </p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              <button
                id="navbar-btn-search"
                type="button"
                onClick={onOpenSearch}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl bg-[#1D1D1F] text-white hover:bg-black transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Stock</span>
              </button>

              <button
                id="navbar-btn-mark-seen"
                type="button"
                onClick={onMarkAllSeen}
                title="Update your baseline to current market prices"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl bg-white text-[#1D1D1F] hover:bg-[#F5F5F7] border border-[#E5E5E7] transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[#24A148]" />
                <span className="hidden md:inline">Mark All as Seen</span>
              </button>

              <button
                id="navbar-btn-settings"
                type="button"
                onClick={onOpenSettings}
                className="p-2 rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] border border-[#E5E5E7] transition-colors"
                title="Engine Settings & Preferences"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>

              <div className="h-5 w-px bg-[#E5E5E7] mx-1 hidden sm:block" />

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E8E8ED] border border-[#D2D2D7] flex items-center justify-center text-xs text-[#1D1D1F] font-bold">
                  {user.email ? user.email.slice(0, 2).toUpperCase() : 'GS'}
                </div>
                <button
                  id="navbar-btn-logout"
                  type="button"
                  onClick={onLogout}
                  className="p-2 text-[#86868B] hover:text-[#E01414] hover:bg-[#FEE2E2]/60 rounded-xl transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              id="navbar-btn-login"
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-[#1D1D1F] text-white hover:bg-black transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
