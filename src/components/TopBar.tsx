import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, CheckCircle2, AlertTriangle, ArrowRight, User } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';

interface TopBarProps {
  user: FirebaseUser | null;
  onOpenSearch: () => void;
  onOpenMobileMenu: () => void;
  onSelectStock?: (ticker: string) => void;
  onLogout: () => void;
}

export function TopBar({
  user,
  onOpenSearch,
  onOpenMobileMenu,
  onSelectStock,
  onLogout,
}: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const displayName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Ananya');
  const userInitial = displayName.charAt(0).toUpperCase() || 'A';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    {
      id: 'notif-1',
      ticker: 'NVDA',
      title: 'Major Change in NVIDIA',
      message: 'Surged 8.4% with 2.6× volume and earnings announcement detected.',
      time: '2h ago',
      type: 'major',
    },
    {
      id: 'notif-2',
      ticker: 'TCS',
      title: 'TCS is Worth Watching',
      message: 'Moved 2.1% lower on higher volume with new analyst revisions.',
      time: '4h ago',
      type: 'warning',
    },
    {
      id: 'notif-3',
      ticker: 'MARKET',
      title: 'Baseline Check Complete',
      message: 'All remaining watchlist items are trading within normal baseline volatility.',
      time: '6h ago',
      type: 'info',
    },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      {/* Mobile Menu & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-[#64748B] hover:text-[#0F1B3D] hover:bg-[#F8FAFC] rounded-lg"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div
          onClick={onOpenSearch}
          className="cursor-pointer flex items-center gap-2.5 w-full bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] px-3.5 py-2 rounded-xl transition-all shadow-xs text-xs text-[#64748B]"
        >
          <Search className="w-4 h-4 text-[#94A3B8] shrink-0" />
          <span className="truncate hidden sm:inline">
            Search for a stock (e.g., NVIDIA, TCS, Reliance)...
          </span>
          <span className="truncate sm:hidden">Search stocks...</span>
          <kbd className="ml-auto hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-[#94A3B8] bg-white border border-[#E2E8F0] rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            id="topbar-btn-notifications"
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnreadCount(0);
            }}
            className="p-2.5 text-[#64748B] hover:text-[#0F1B3D] hover:bg-[#F8FAFC] rounded-xl relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
                <span className="font-bold text-sm text-[#0F1B3D]">Notifications</span>
                <span className="text-[11px] text-[#64748B] font-medium">Changes since last check</span>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.ticker !== 'MARKET' && onSelectStock) {
                        onSelectStock(n.ticker);
                        setShowNotifications(false);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      n.type === 'major'
                        ? 'bg-[#FEF2F2]/50 border-red-200 hover:bg-[#FEF2F2]'
                        : n.type === 'warning'
                        ? 'bg-[#FFFBEB]/50 border-amber-200 hover:bg-[#FFFBEB]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className={n.type === 'major' ? 'text-[#DC2626]' : n.type === 'warning' ? 'text-[#D97706]' : 'text-[#0F1B3D]'}>
                        {n.title}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] font-normal">{n.time}</span>
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">{n.message}</p>
                    {n.ticker !== 'MARKET' && (
                      <div className="mt-2 text-[11px] font-semibold text-[#0F1B3D] flex items-center gap-1 hover:underline">
                        <span>View {n.ticker} deep dive</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Menu */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F8FAFC] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#E0E7FF] text-[#3730A3] font-bold text-xs flex items-center justify-center">
              {userInitial}
            </div>
            <span className="text-xs font-bold text-[#0F1B3D] hidden sm:inline">
              {displayName}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-[#E2E8F0] mb-1">
                <div className="text-xs font-bold text-[#0F1B3D]">{displayName}</div>
                <div className="text-[11px] text-[#64748B] truncate">{user?.email || 'ananya@example.com'}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  onLogout();
                }}
                className="w-full text-left px-3 py-2 text-xs text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg font-medium transition-colors"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
