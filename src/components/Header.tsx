import React from 'react';
import { Menu, Coins, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavigationTab } from '../types';

interface HeaderProps {
  onOpenSidebar: () => void;
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar, currentTab, onSelectTab }) => {
  const { userProfile, isAdmin, settings } = useAuth();

  const getTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Dashboard';
      case 'profile': return 'User Profile';
      case 'submit': return 'Submit Promotion';
      case 'history': return 'Submission History';
      case 'rewards': return 'Rewards';
      case 'payments': return 'Payments';
      case 'admin': return 'Admin Panel';
      case 'settings': return 'Settings';
      default: return 'TripToCoin';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs overflow-hidden">
            {settings?.siteLogoUrl ? (
              <img src={settings.siteLogoUrl} alt="TripToCoin Logo" className="w-full h-full object-cover" />
            ) : (
              <Coins className="w-5 h-5" />
            )}
          </div>
          <span className="font-bold text-lg text-slate-900">TripToCoin</span>
        </div>

        <h2 className="hidden lg:block text-xl font-bold text-slate-800 tracking-tight">
          {getTitle()}
        </h2>
      </div>

      <div className="flex items-center space-x-3">
        {isAdmin && (
          <button
            onClick={() => onSelectTab('admin')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Admin Access</span>
          </button>
        )}

        <button
          onClick={() => onSelectTab('profile')}
          className="flex items-center space-x-2.5 p-1.5 pl-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-xs font-medium"
        >
          <span className="hidden sm:inline font-semibold">{userProfile?.fullName || 'My Account'}</span>
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            {userProfile?.fullName?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
          </div>
        </button>
      </div>
    </header>
  );
};
