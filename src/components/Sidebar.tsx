import React from 'react';
import { 
  LayoutDashboard, 
  User, 
  Send, 
  History, 
  Award, 
  CreditCard, 
  ShieldCheck, 
  Settings, 
  LogOut,
  Coins,
  ChevronRight,
  X
} from 'lucide-react';
import { NavigationTab } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose
}) => {
  const { userProfile, isAdmin, logout, settings } = useAuth();

  const navItems: { id: NavigationTab; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'submit', label: 'Submit Promotion', icon: Send },
    { id: 'history', label: 'Submission History', icon: History },
    { id: 'rewards', label: 'Rewards', icon: Award },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'admin', label: 'Admin Panel', icon: ShieldCheck, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-slate-900 text-slate-100 border-r border-slate-800 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-emerald-500 to-amber-500 flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden">
              {settings?.siteLogoUrl ? (
                <img src={settings.siteLogoUrl} alt="TripToCoin Logo" className="w-full h-full object-cover" />
              ) : (
                <Coins className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white flex items-center gap-1">
                TripTo<span className="text-emerald-400">Coin</span>
              </h1>
              <p className="text-xs text-slate-400">Rewards Platform</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;

            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.adminOnly && (
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Admin
                  </span>
                )}
                {isActive && !item.adminOnly && (
                  <ChevronRight className="w-4 h-4 text-blue-200" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center text-sm">
              {userProfile?.fullName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userProfile?.fullName || 'Promoter'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {userProfile?.email || ''}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
