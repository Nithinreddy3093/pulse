import { 
  Home, 
  Bookmark, 
  Compass, 
  Newspaper, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Activity, 
  Sparkles,
  X
} from 'lucide-react';
import type { User } from 'firebase/auth';

export type NavigationTab = 'home' | 'watchlist' | 'explore' | 'news' | 'insights' | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  user: User | null;
  onLogout: () => void;
  onCloseMobile?: () => void;
  isMobileDrawer?: boolean;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  user,
  onLogout,
  onCloseMobile,
  isMobileDrawer = false,
}: SidebarProps) {
  const navItems: { id: NavigationTab; label: string; icon: any }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'insights', label: 'Market Insights', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Ananya');
  const userInitial = displayName.charAt(0).toUpperCase() || 'A';
  const displayEmail = user?.email || 'ananya@example.com';

  const content = (
    <div className="h-full flex flex-col justify-between p-5 bg-white border-r border-[#E2E8F0]">
      {/* Brand & Tagline */}
      <div>
        <div className="flex items-center justify-between pb-6 mb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F1B3D] flex items-center justify-center text-white shadow-xs">
              <Activity className="w-5 h-5 text-[#10B981] stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xl text-[#0F1B3D] tracking-tight">Pulse</span>
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
              </div>
              <p className="text-xs text-[#64748B] font-medium">Know what matters.</p>
            </div>
          </div>

          {isMobileDrawer && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-2 text-[#64748B] hover:text-[#0F1B3D] rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#0F1B3D] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F1B3D] hover:bg-[#F8FAFC]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#3B82F6]' : 'text-[#64748B]'
                  }`}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-4 rounded-full bg-[#3B82F6]"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom area: Promo banner + Profile row */}
      <div className="space-y-4 pt-4 border-t border-[#E2E8F0]">
        {/* Subtle Promo Card */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 text-xs text-[#64748B] space-y-1">
          <div className="flex items-center gap-1.5 text-[#0F1B3D] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Stay informed, not overwhelmed.</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#64748B]">
            Pulse tracks the changes that actually matter to your portfolio.
          </p>
        </div>

        {/* User profile row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-[#E0E7FF] text-[#3730A3] font-bold text-sm flex items-center justify-center shrink-0">
              {userInitial}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-[#0F1B3D] truncate">{displayName}</div>
              <div className="text-[11px] text-[#64748B] truncate">{displayEmail}</div>
            </div>
          </div>

          <button
            id="sidebar-btn-logout"
            type="button"
            onClick={onLogout}
            title="Log out"
            className="p-2 text-[#64748B] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (isMobileDrawer) {
    return content;
  }

  return (
    <aside className="w-64 shrink-0 hidden lg:block sticky top-0 h-screen z-30">
      {content}
    </aside>
  );
}
