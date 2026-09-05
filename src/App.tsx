import { useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  logoutUser, 
  getUserWatchlist, 
  saveUserWatchlist, 
  getUserStockStates, 
  saveUserStockState,
  type User 
} from './services/firebase';
import { apiClient } from './services/apiClient';
import { Sidebar, type NavigationTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DemoBar } from './components/DemoBar';
import { HomeView } from './components/HomeView';
import { StockDetailView } from './components/StockDetailView';
import { WatchlistView } from './components/WatchlistView';
import { ExploreView } from './components/ExploreView';
import { NewsView } from './components/NewsView';
import { InsightsView } from './components/InsightsView';
import { SettingsView } from './components/SettingsView';
import { LandingView } from './components/LandingView';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';
import type { WatchlistSummary, UserStockState, MarketFreshness } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [tickers, setTickers] = useState<string[]>(['NVDA', 'AAPL', 'TSLA', 'MSFT']);
  const [userStates, setUserStates] = useState<Record<string, UserStockState>>({});
  const [summary, setSummary] = useState<WatchlistSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [freshness, setFreshness] = useState<MarketFreshness>('live');

  // Modals & Navigation
  const [selectedStockTicker, setSelectedStockTicker] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // 1. Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          apiClient.setIdToken(token);
        } catch {
          apiClient.setIdToken(null);
        }
        apiClient.setUserId(currentUser.uid);
        try {
          const [savedTickers, savedStates] = await Promise.all([
            getUserWatchlist(currentUser.uid),
            getUserStockStates(currentUser.uid),
          ]);
          setTickers(savedTickers);
          setUserStates(savedStates);
        } catch (fsErr) {
          console.error('[Firestore] Initialization fetch error:', fsErr);
        }
      } else {
        apiClient.setUserId(null);
        apiClient.setIdToken(null);
        setTickers(['NVDA', 'AAPL', 'TSLA', 'MSFT']);
        setUserStates({});
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch watchlist intelligence from backend
  const fetchWatchlistChanges = useCallback(async () => {
    if (tickers.length === 0) {
      setSummary({
        totalTracked: 0,
        majorChangesCount: 0,
        worthWatchingCount: 0,
        normalCount: 0,
        lastCheckedAt: null,
        items: [],
        allCaughtUp: true,
        isDemoActive: activeScenarioId !== null,
      });
      return;
    }

    setLoadingSummary(true);
    const result = await apiClient.getWatchlistChanges(tickers, userStates);
    if (result) {
      setSummary(result);
      if (result.items.length > 0) {
        setFreshness(result.items[0].stock.freshness);
      }
    }
    setLoadingSummary(false);
  }, [tickers, userStates, activeScenarioId]);

  useEffect(() => {
    if (user) {
      fetchWatchlistChanges();
    }
  }, [user, fetchWatchlistChanges]);

  // Handle instant evaluator sign-in without attempting disabled Firebase anonymous auth
  const handleInstantDemoLogin = () => {
    const guestUser: any = {
      uid: 'evaluator-guest-user',
      displayName: 'Evaluator Guest',
      email: null,
      isAnonymous: true,
      getIdToken: async () => null,
    };
    apiClient.setUserId('evaluator-guest-user');
    apiClient.setIdToken(null);
    setUser(guestUser);
    setTickers(['NVDA', 'AAPL', 'TSLA', 'MSFT']);
    setUserStates({});
  };

  // Handle Scenario trigger in DemoBar
  const handleScenarioChanged = async () => {
    const res = await fetch('/api/demo/scenarios').then((r) => r.json());
    setActiveScenarioId(res.activeScenario);
    await fetchWatchlistChanges();
  };

  // Handle Mark Single Stock as Seen
  const handleMarkSeen = async (ticker: string) => {
    const updated = await apiClient.markAllSeen(tickers, ticker);
    const newState = updated[ticker];
    if (newState) {
      if (user && !user.isAnonymous) {
        try {
          await saveUserStockState(user.uid, newState);
        } catch (e) {
          console.warn('[Firestore] Could not persist stock state:', e);
        }
      }
      setUserStates((prev) => ({ ...prev, [ticker]: newState }));
    }
  };

  // Handle Mark All Stocks as Seen
  const handleMarkAllSeen = async () => {
    const updated = await apiClient.markAllSeen(tickers);
    if (user && !user.isAnonymous) {
      try {
        for (const t of Object.keys(updated)) {
          await saveUserStockState(user.uid, updated[t]);
        }
      } catch (e) {
        console.warn('[Firestore] Could not persist stock states:', e);
      }
    }
    setUserStates((prev) => ({ ...prev, ...updated }));
  };

  // Handle Add Stock
  const handleAddTicker = async (ticker: string) => {
    const sym = ticker.toUpperCase();
    if (!tickers.includes(sym)) {
      const next = [...tickers, sym];
      setTickers(next);
      if (user && !user.isAnonymous) {
        try {
          await saveUserWatchlist(user.uid, next);
        } catch (e) {
          console.warn('[Firestore] Could not persist watchlist:', e);
        }
      }
    }
  };

  // Handle Remove Stock
  const handleRemoveTicker = async (ticker: string) => {
    const sym = ticker.toUpperCase();
    const next = tickers.filter((t) => t !== sym);
    setTickers(next);
    if (user && !user.isAnonymous) {
      try {
        await saveUserWatchlist(user.uid, next);
      } catch (e) {
        console.warn('[Firestore] Could not persist watchlist:', e);
      }
    }
  };

  const handleLogout = async () => {
    if (user && !user.isAnonymous) {
      await logoutUser();
    }
    apiClient.setUserId(null);
    apiClient.setIdToken(null);
    setUser(null);
    setSummary(null);
    setSelectedStockTicker(null);
    setCurrentTab('home');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] text-[#0F1B3D] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#0F1B3D] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#64748B] font-semibold tracking-wide">
            Loading Pulse...
          </p>
        </div>
      </div>
    );
  }

  // Not Logged In: Show Clean Landing Page
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] text-[#0F1B3D] font-sans antialiased flex flex-col justify-between">
        <header className="px-6 py-4 border-b border-[#E2E8F0] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F1B3D] flex items-center justify-center text-white shadow-xs">
              <span className="font-black text-sm text-[#10B981]">P</span>
            </div>
            <span className="font-bold text-lg text-[#0F1B3D] tracking-tight">Pulse</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleInstantDemoLogin}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-[#0F1B3D] text-white hover:bg-[#18264D] transition-colors shadow-xs"
            >
              Explore Live Workspace
            </button>
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#0F1B3D] hover:bg-[#F8FAFC] transition-colors shadow-2xs"
            >
              Sign In
            </button>
          </div>
        </header>

        <main className="flex-1">
          <LandingView
            onSignIn={() => setIsAuthOpen(true)}
            onInstantDemo={handleInstantDemoLogin}
          />
        </main>

        <footer className="py-6 border-t border-[#E2E8F0] text-center text-xs text-[#64748B] bg-white">
          Pulse • Know what changed. Know what matters.
        </footer>

        {isAuthOpen && (
          <AuthModal
            onClose={() => setIsAuthOpen(false)}
            onSuccess={() => setIsAuthOpen(false)}
          />
        )}
      </div>
    );
  }

  // Logged In: Render App Shell
  const userName = user.displayName || (user.email ? user.email.split('@')[0] : 'Ananya');

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#0F1B3D] font-sans antialiased flex flex-col">
      {/* Discreet Market Scenario Simulator Bar */}
      <DemoBar
        onScenarioChanged={handleScenarioChanged}
        activeScenarioId={activeScenarioId}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex min-h-0">
        {/* Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setSelectedStockTicker(null);
          }}
          user={user}
          onLogout={handleLogout}
        />

        {/* Mobile Sidebar Drawer Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] h-full z-10 animate-in slide-in-from-left duration-200">
              <Sidebar
                currentTab={currentTab}
                onSelectTab={(tab) => {
                  setCurrentTab(tab);
                  setSelectedStockTicker(null);
                  setIsMobileMenuOpen(false);
                }}
                user={user}
                onLogout={handleLogout}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
                isMobileDrawer={true}
              />
            </div>
          </div>
        )}

        {/* Main Work Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Header Bar */}
          <TopBar
            user={user}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onSelectStock={(ticker) => setSelectedStockTicker(ticker)}
            onLogout={handleLogout}
          />

          {/* Active View Router */}
          <main className="flex-1 pb-16">
            {selectedStockTicker ? (
              <StockDetailView
                ticker={selectedStockTicker}
                onBack={() => setSelectedStockTicker(null)}
                userState={userStates[selectedStockTicker]}
                onMarkSeen={handleMarkSeen}
                onSelectOtherStock={(t) => setSelectedStockTicker(t)}
              />
            ) : currentTab === 'home' ? (
              <HomeView
                summary={summary}
                loading={loadingSummary}
                onSelectStock={(t) => setSelectedStockTicker(t)}
                onOpenSearch={() => setIsSearchOpen(true)}
                onViewWatchlist={() => setCurrentTab('watchlist')}
                onViewInsights={() => setCurrentTab('insights')}
                onViewNews={() => setCurrentTab('news')}
                onMarkSeen={handleMarkSeen}
                onRemoveStock={handleRemoveTicker}
                userName={userName}
              />
            ) : currentTab === 'watchlist' ? (
              <WatchlistView
                summary={summary}
                onSelectStock={(t) => setSelectedStockTicker(t)}
                onOpenSearch={() => setIsSearchOpen(true)}
                onMarkSeen={handleMarkSeen}
                onMarkAllSeen={handleMarkAllSeen}
                onRemoveStock={handleRemoveTicker}
              />
            ) : currentTab === 'explore' ? (
              <ExploreView
                watchlistTickers={tickers}
                onAddStock={handleAddTicker}
                onSelectStock={(t) => setSelectedStockTicker(t)}
              />
            ) : currentTab === 'news' ? (
              <NewsView
                onSelectStock={(t) => setSelectedStockTicker(t)}
              />
            ) : currentTab === 'insights' ? (
              <InsightsView
                onSelectStock={(t) => setSelectedStockTicker(t)}
              />
            ) : (
              <SettingsView
                user={user}
                onResetDemo={handleMarkAllSeen}
              />
            )}
          </main>
        </div>
      </div>

      {/* Global Modals */}
      {isSearchOpen && (
        <SearchModal
          currentTickers={tickers}
          onAddTicker={handleAddTicker}
          onRemoveTicker={handleRemoveTicker}
          onClose={() => setIsSearchOpen(false)}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          onSuccess={() => setIsAuthOpen(false)}
        />
      )}
    </div>
  );
}
