import React from 'react';
import { Eye, ThumbsUp, Repeat, TrendingUp, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PromotionTargetBanners: React.FC = () => {
  const { settings } = useAuth();

  const vTarget = settings?.heroBannerViews || 100000;
  const lTarget = settings?.heroBannerLikes || 100000;
  const rTarget = settings?.heroBannerReposts || 100000;

  const vReward = vTarget * (settings?.rewardPerView || 0.002);
  const lReward = lTarget * (settings?.rewardPerLike || 0.005);
  const rReward = rTarget * (settings?.rewardPerRepost || 0.5);
  const totalReward = vReward + lReward + rReward;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Views Promo */}
      <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-5">
          <TrendingUp className="w-16 h-16 text-blue-600" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
           <Eye className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-tight">Views Target</h4>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">${vReward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[10px] font-bold text-blue-600">for {vTarget.toLocaleString()} Views</span>
          </div>
        </div>
      </div>

      {/* Likes Promo */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-5">
          <TrendingUp className="w-16 h-16 text-emerald-600" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
           <ThumbsUp className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-tight">Likes Target</h4>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">${lReward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[10px] font-bold text-emerald-600">for {lTarget.toLocaleString()} Likes</span>
          </div>
        </div>
      </div>

      {/* Reposts Promo */}
      <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-5">
          <TrendingUp className="w-16 h-16 text-amber-600" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-600/20">
           <Repeat className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-tight">Reposts Target</h4>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-900">${rReward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[10px] font-bold text-amber-600">for {rTarget.toLocaleString()} Reposts</span>
          </div>
        </div>
      </div>

      {/* Total Promo */}
      <div className="bg-slate-900 p-5 rounded-2xl shadow-xl flex items-center gap-4 relative overflow-hidden group border border-slate-800">
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <Sparkles className="w-16 h-16 text-white" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
           <TrendingUp className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-tight">Total Potential</h4>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-white">${totalReward.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-[10px] font-bold text-indigo-400">for All Targets</span>
          </div>
        </div>
      </div>
    </div>
  );
};
