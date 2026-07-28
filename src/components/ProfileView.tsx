import React, { useEffect, useState } from 'react';
import { User, Mail, MessageSquare, Phone, Twitter, Wallet, Globe, CheckCircle2, Save, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';

export const ProfileView: React.FC = () => {
  const { userProfile, updateProfileData } = useAuth();

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    fullName: '',
    email: '',
    telegram: '',
    whatsapp: '',
    twitter: '',
    wallet: '',
    walletBep20: '',
    walletArb: '',
    country: ''
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (userProfile) {
      setFormData({
        fullName: userProfile.fullName || '',
        email: userProfile.email || '',
        telegram: userProfile.telegram || '',
        whatsapp: userProfile.whatsapp || '',
        twitter: userProfile.twitter || '',
        wallet: userProfile.wallet || userProfile.walletBep20 || '',
        walletBep20: userProfile.walletBep20 || userProfile.wallet || '',
        walletArb: userProfile.walletArb || '',
        country: userProfile.country || ''
      });
    }
  }, [userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      await updateProfileData(formData);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const countries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
    'India', 'Nigeria', 'Brazil', 'Japan', 'South Korea', 'Singapore', 'Indonesia',
    'Pakistan', 'Bangladesh', 'Vietnam', 'Philippines', 'Turkey', 'United Arab Emirates', 'Other'
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-blue-500/20">
          {formData.fullName?.[0]?.toUpperCase() || <User className="w-8 h-8" />}
        </div>
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-xl font-bold text-slate-900">{formData.fullName || 'Promoter Profile'}</h1>
          <p className="text-xs text-slate-500">{formData.email}</p>
          <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified TripToCoin Promoter</span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Personal & Contact Information</h2>
          <p className="text-xs text-slate-500">Keep your details up to date to receive prompt reward verification and payouts.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName || ''}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Gmail Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Gmail Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                name="email"
                readOnly
                value={formData.email || ''}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Associated with your Google Sign-In</span>
          </div>

          {/* Telegram Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Telegram Username
            </label>
            <div className="relative">
              <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                name="telegram"
                value={formData.telegram || ''}
                onChange={handleChange}
                placeholder="@username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              WhatsApp Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp || ''}
                onChange={handleChange}
                placeholder="+1 234 567 890"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* X (Twitter) Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              X (Twitter) Username
            </label>
            <div className="relative">
              <Twitter className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                name="twitter"
                value={formData.twitter || ''}
                onChange={handleChange}
                placeholder="@my_twitter_handle"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Country
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <select
                name="country"
                value={formData.country || ''}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none"
              >
                <option value="">Select Country</option>
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Wallet Address Section - Two Separate Network Fields */}
        <div className="pt-5 border-t border-slate-100 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-blue-600" />
              <span>Crypto Wallet Addresses (Payout Destinations)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Please enter your separate receiving wallet addresses for both supported USDT payment networks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Field 1: usdt BEP-20 */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>usdt BEP-20 *</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono">BNB Smart Chain</span>
              </label>
              <div className="relative">
                <Wallet className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="walletBep20"
                  required
                  value={formData.walletBep20 || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, walletBep20: val, wallet: val }));
                  }}
                  placeholder="0x..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Field 2: usdt arb */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>usdt arb *</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono">Arbitrum One</span>
              </label>
              <div className="relative">
                <Wallet className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="walletArb"
                  required
                  value={formData.walletArb || ''}
                  onChange={handleChange}
                  placeholder="0x..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 flex items-center space-x-1.5 pt-1">
            <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>Double check both wallet addresses carefully. Approved reward payments will be transferred directly to these addresses.</span>
          </p>
        </div>

        {/* Submit button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
