import React, { useState } from 'react';
import { Settings, ShieldCheck, User, Coins, Image as ImageIcon, Upload, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavigationTab } from '../types';
import { compressImageToDataUrl } from '../lib/imageUtils';

interface SettingsViewProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onSelectTab }) => {
  const { userProfile, isAdmin, setDemoAdmin, settings, updateSystemSettings } = useAuth();

  const [logoInput, setLogoInput] = useState<string>(settings?.siteLogoUrl || '');
  const [savingLogo, setSavingLogo] = useState<boolean>(false);
  const [logoSuccessMsg, setLogoSuccessMsg] = useState<string>('');

  // Preset logo choices
  const presetLogos = [
    { name: 'Gold Coin', url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=120&q=80' },
    { name: 'Crypto Token', url: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?auto=format&fit=crop&w=120&q=80' },
    { name: 'Emerald Badge', url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=120&q=80' }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImageToDataUrl(file, 160, 0.85);
      setLogoInput(compressedDataUrl);
    } catch (err) {
      console.error('Error compressing image file:', err);
      alert('Failed to process image file.');
    }
  };

  const handleSaveLogo = async () => {
    setSavingLogo(true);
    setLogoSuccessMsg('');
    try {
      let finalLogo = logoInput;
      if (finalLogo && finalLogo.startsWith('data:image/') && finalLogo.length > 100000) {
        finalLogo = await compressImageToDataUrl(finalLogo, 160, 0.85);
      }
      await updateSystemSettings({ siteLogoUrl: finalLogo });
      setLogoSuccessMsg('Website Logo updated successfully!');
      setTimeout(() => setLogoSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving logo:', err);
      alert('Failed to update website logo.');
    } finally {
      setSavingLogo(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-xs text-slate-500">Manage preferences, logo branding, and evaluation controls for TripToCoin</p>
      </div>

      {/* Website Logo Customization Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Website Logo Customization</h3>
            <p className="text-xs text-slate-500">
              Upload or paste a custom logo image URL to display next to the "TripToCoin" site name.
            </p>
          </div>
        </div>

        {logoSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{logoSuccessMsg}</span>
          </div>
        )}

        {/* Live Logo Preview */}
        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Live Header Preview</span>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-emerald-500 to-amber-500 flex items-center justify-center shadow-md overflow-hidden">
                {logoInput ? (
                  <img src={logoInput} alt="Preview Logo" className="w-full h-full object-cover" />
                ) : (
                  <Coins className="w-6 h-6 text-white" />
                )}
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                TripTo<span className="text-emerald-400">Coin</span>
              </span>
            </div>
          </div>

          {logoInput && (
            <button
              type="button"
              onClick={() => setLogoInput('')}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg border border-slate-700"
            >
              Reset Default
            </button>
          )}
        </div>

        {/* Input Controls */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Logo Image URL</label>
            <input
              type="url"
              placeholder="https://example.com/logo.png or upload file below..."
              value={logoInput}
              onChange={(e) => setLogoInput(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200 transition-colors">
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Upload Image File</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <span className="text-slate-400 text-[11px]">Or select preset:</span>
            {presetLogos.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setLogoInput(p.url)}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 flex items-center gap-1.5"
              >
                <img src={p.url} alt={p.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                <span>{p.name}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveLogo}
            disabled={savingLogo}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{savingLogo ? 'Saving Logo...' : 'Save Website Logo'}</span>
          </button>
        </div>
      </div>

      {/* Admin Demo Switch Card */}
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
              {isAdmin ? 'Admin Mode is currently ACTIVE.' : 'Standard Promoter Mode.'}
            </span>
          </div>

          <button
            onClick={() => setDemoAdmin(!isAdmin)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              isAdmin
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
            }`}
          >
            {isAdmin ? 'Disable Admin View' : 'Enable Admin View'}
          </button>
        </div>
      </div>

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
