import React from 'react';
import { ShieldCheck, User, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavigationTab } from '../types';

interface SettingsViewProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSelectTab }) => {
  const { userProfile, isAdmin, setDemoAdmin } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-xs text-slate-500">Manage account preferences and view system details for TripToCoin</p>
      </div>

      {/* Admin Demo Switch Card - Only visible to Admins */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Administrator Evaluation Control</h3>
              <p className="text-xs text-slate-500">Toggle administrator mode to review admin capabilities, user management, and payout controls.</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-xs text-slate-800 block">Admin Privileges</span>
              <span className="text-[11px] text-slate-500">
                Admin Mode is currently ACTIVE.
              </span>
            </div>

            <button
              onClick={() => setDemoAdmin(!isAdmin)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-colors bg-amber-500 text-white hover:bg-amber-600"
            >
              Disable Admin View
            </button>
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Account Summary</h3>
            <p className="text-xs text-slate-500">Profile information associated with your active session.</p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Full Name:</span>
            <span className="font-bold text-slate-800">{userProfile?.fullName || 'Promoter'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Gmail:</span>
            <span className="font-mono text-slate-800">{userProfile?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Wallet:</span>
            <span className="font-mono text-slate-800 truncate max-w-[200px]">{userProfile?.wallet || 'Not configured'}</span>
          </div>
        </div>

        <button
          onClick={() => onSelectTab('profile')}
          className="text-xs text-blue-600 font-bold hover:underline block pt-2"
        >
          Edit Full Profile →
        </button>
      </div>

      {/* Platform Info */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs text-xs text-slate-500 space-y-2">
        <div className="flex items-center space-x-2 font-bold text-slate-800 text-sm mb-2">
          <Coins className="w-4 h-4 text-emerald-500" />
          <span>TripToCoin System Metadata</span>
        </div>
        <p>Database: Firebase Firestore (Online Sync)</p>
        <p>Auth: Firebase Authentication (Google Sign-In)</p>
        <p>Copyright: © 2026 TripToCoin. All Rights Reserved.</p>
      </div>
    </div>
  );
};

