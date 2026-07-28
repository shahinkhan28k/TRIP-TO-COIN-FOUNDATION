/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ProfileView } from './components/ProfileView';
import { SubmitPromotionView } from './components/SubmitPromotionView';
import { SubmissionHistoryView } from './components/SubmissionHistoryView';
import { RewardsView } from './components/RewardsView';
import { PaymentsView } from './components/PaymentsView';
import { AdminPanel } from './components/AdminPanel';
import { SettingsView } from './components/SettingsView';
import { NavigationTab } from './types';
import { Coins, LogOut, ShieldCheck, User } from 'lucide-react';

function MainAppContent() {
  const { user, userProfile, isAdmin, loading, logout, settings } = useAuth();
  
  // URL Path Matching & Syncing
  const getTabFromPath = (): NavigationTab => {
    const path = window.location.pathname.replace(/^\/+/, '');
    const validTabs: NavigationTab[] = ['dashboard', 'profile', 'submit', 'history', 'rewards', 'payments', 'admin', 'settings'];
    if (validTabs.includes(path as NavigationTab)) {
      return path as NavigationTab;
    }
    return 'dashboard';
  };

  const [currentTab, setCurrentTab] = useState<NavigationTab>(getTabFromPath());
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Sync state with URL path
  const handleSelectTab = (tab: NavigationTab) => {
    setCurrentTab(tab);
    if (window.location.pathname !== `/${tab}`) {
      window.history.pushState({}, '', `/${tab}`);
    }
  };

  // Listen for browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentTab(getTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-semibold text-sm text-slate-300">Loading TripToCoin Platform...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated view
  if (!user) {
    return <LandingPage />;
  }

  // Dedicated Isolated Page View for Admin Panel
  if (currentTab === 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Admin Portal Header (Does NOT contain standard website buttons) */}
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/20 overflow-hidden">
              {settings?.siteLogoUrl ? (
                <img src={settings.siteLogoUrl} alt="TripToCoin Logo" className="w-full h-full object-cover" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-slate-950" />
              )}
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white tracking-tight flex items-center gap-2">
                TripToCoin <span className="text-amber-400 text-xs uppercase px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-full font-mono">Admin Portal</span>
              </h1>
              <p className="text-[11px] text-slate-400">Isolated Management Environment</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSelectTab('dashboard')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Exit Admin Panel</span>
            </button>

            <button
              onClick={logout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dedicated Admin Panel Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto text-slate-900">
          <AdminPanel onExitAdmin={() => handleSelectTab('dashboard')} />
        </main>

        <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-600 mt-auto">
          <p>© 2026 TripToCoin Admin Control System. All operations are logged.</p>
        </footer>
      </div>
    );
  }

  // Standard Authenticated User Web App Shell
  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && <DashboardView onSelectTab={handleSelectTab} />}
          {currentTab === 'profile' && <ProfileView />}
          {currentTab === 'submit' && <SubmitPromotionView onSelectTab={handleSelectTab} />}
          {currentTab === 'history' && <SubmissionHistoryView />}
          {currentTab === 'rewards' && <RewardsView onSelectTab={handleSelectTab} />}
          {currentTab === 'payments' && <PaymentsView />}
          {currentTab === 'settings' && <SettingsView onSelectTab={handleSelectTab} />}
        </main>

        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 mt-auto">
          <p>© 2026 TripToCoin. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
