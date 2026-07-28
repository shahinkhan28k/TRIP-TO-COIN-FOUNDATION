import React, { useState, useEffect } from 'react';
import { Twitter, Link2, FileText, Send, CheckCircle2, AlertCircle, Sparkles, HelpCircle, Bot, RefreshCw, Eye, ThumbsUp, Repeat, MessageCircle, DollarSign, ShieldCheck, User, Edit3 } from 'lucide-react';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { NavigationTab, SystemSettings } from '../types';
import { fetchTweetMetrics } from '../lib/twitter';
import { PromotionTargetBanners } from './PromotionTargetBanners';

interface SubmitPromotionViewProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const SubmitPromotionView: React.FC<SubmitPromotionViewProps> = ({ onSelectTab }) => {
  const { user, userProfile } = useAuth();

  const [tweetUrl, setTweetUrl] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // AI Verification State
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [aiVerified, setAiVerified] = useState<boolean>(false);
  const [aiMetrics, setAiMetrics] = useState<{
    views: number;
    likes: number;
    reposts: number;
    replies: number;
    estimatedReward: number;
    officialMentioned: boolean;
    authorName?: string;
    authorHandle?: string;
    tweetText?: string;
    fetchedRealData?: boolean;
  } | null>(null);

  // Settings for rate multipliers
  const [settings, setSettings] = useState<SystemSettings>({
    minPayoutUsd: 10,
    rewardPerView: 0.002,
    rewardPerLike: 0.005,
    rewardPerRepost: 0.5,
    usdtBep20Contract: '',
    usdtArbContract: '',
    maintenanceMode: false,
    announcementBanner: '',
    supportTelegram: '',
    officialTwitterAccount: 'https://x.com/TripToCoin'
  });

  useEffect(() => {
    // Load system settings
    const fetchSettings = async () => {
      try {
        const sRef = doc(db, 'settings', 'global');
        const snap = await getDoc(sRef);
        if (snap.exists()) {
          setSettings(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };
    fetchSettings();
  }, []);

  // Recalculate reward dynamically when user modifies engagement metrics
  const calculateReward = (views: number, likes: number, reposts: number, officialMentioned: boolean = true) => {
    if (!officialMentioned) return 0;
    const vReward = views * (settings.rewardPerView || 0.002);
    const lReward = likes * (settings.rewardPerLike || 0.005);
    const rReward = reposts * (settings.rewardPerRepost || 0.5);
    const total = vReward + lReward + rReward;
    if (total <= 0) return 0;
    return Math.round(total * 100) / 100;
  };

  // AI Verification Handler (Fetches Real Data from Twitter/X)
  const handleAiVerification = async () => {
    setErrorMsg('');
    const trimmed = tweetUrl.trim();
    if (!trimmed.includes('twitter.com') && !trimmed.includes('x.com')) {
      setErrorMsg('Please enter a valid Twitter/X post URL (e.g. https://x.com/username/status/1234567890)');
      return;
    }

    setAnalyzing(true);
    setAiVerified(false);

    try {
      const details = await fetchTweetMetrics(trimmed, settings.officialTwitterAccount || 'TripToCoin');
      const estReward = calculateReward(details.views, details.likes, details.reposts, details.isMentioned);

      setAiMetrics({
        views: details.views,
        likes: details.likes,
        reposts: details.reposts,
        replies: details.replies,
        estimatedReward: estReward,
        officialMentioned: details.isMentioned,
        authorName: details.authorName,
        authorHandle: details.authorHandle,
        tweetText: details.text,
        fetchedRealData: details.fetchedRealData
      });
      setAiVerified(true);
    } catch (err: any) {
      console.error('Error in AI Verification:', err);
      setErrorMsg(err?.message || 'Failed to analyze Twitter post link. Please check the URL.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleMetricChange = (field: 'views' | 'likes' | 'reposts' | 'replies', val: number) => {
    if (!aiMetrics) return;
    const updated = {
      ...aiMetrics,
      [field]: Math.max(0, val)
    };
    updated.estimatedReward = calculateReward(updated.views, updated.likes, updated.reposts, updated.officialMentioned);
    setAiMetrics(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccess(false);

    if (!user) {
      setErrorMsg('You must be signed in to submit a promotion.');
      return;
    }

    const trimmed = tweetUrl.trim();
    if (!trimmed.includes('twitter.com') && !trimmed.includes('x.com')) {
      setErrorMsg('Please enter a valid Twitter/X post URL (e.g. https://x.com/username/status/123456...)');
      return;
    }

    setSubmitting(true);

    try {
      let currentMetrics = aiMetrics;

      // If user submitted without hitting AI verify button first, auto-run verification now
      if (!currentMetrics || !aiVerified) {
        const details = await fetchTweetMetrics(trimmed, settings.officialTwitterAccount || 'TripToCoin');
        const estReward = calculateReward(details.views, details.likes, details.reposts, details.isMentioned);
        currentMetrics = {
          views: details.views,
          likes: details.likes,
          reposts: details.reposts,
          replies: details.replies,
          estimatedReward: estReward,
          officialMentioned: details.isMentioned,
          authorName: details.authorName,
          authorHandle: details.authorHandle,
          tweetText: details.text,
          fetchedRealData: details.fetchedRealData
        };
      }

      if (!currentMetrics.officialMentioned) {
        setErrorMsg('Submission Error: Tweet text must explicitly mention @TripToCoin or #TripToCoin to earn rewards.');
        setSubmitting(false);
        return;
      }

      const newSub = {
        uid: user.uid,
        projectName: 'TripToCoin',
        tweetUrl: trimmed,
        likes: Number(currentMetrics.likes || 0),
        replies: Number(currentMetrics.replies || 0),
        reposts: Number(currentMetrics.reposts || 0),
        bookmarks: 0,
        views: Number(currentMetrics.views || 0),
        status: 'pending',
        rewardAmount: Number(currentMetrics.estimatedReward || 0),
        paymentStatus: 'unpaid',
        aiVerified: true,
        createdAt: new Date().toISOString(),
        note: note.trim(),
        userEmail: user.email || '',
        userFullName: userProfile?.fullName || 'Promoter',
        lastUpdated: new Date().toISOString()
      };

      await addDoc(collection(db, 'submissions'), newSub);

      setSuccess(true);
      setTweetUrl('');
      setNote('');
      setAiMetrics(null);
      setAiVerified(false);
    } catch (err: any) {
      console.error('Error submitting promotion:', err);
      setErrorMsg(err?.message || 'Failed to submit promotion. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const officialLink = settings.officialTwitterAccount || 'https://x.com/TripToCoin';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Promotion Target Banners */}
      <PromotionTargetBanners />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md">
              <Twitter className="w-3.5 h-3.5 text-blue-200" />
              <span>Official Target Account: <strong className="text-amber-300 font-mono">{officialLink.replace('https://x.com/', '@')}</strong></span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Submit Promotional Post</h1>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed max-w-xl">
              Published a tweet mentioning <strong>TripToCoin</strong>? Paste your tweet link below. Our AI system will automatically detect engagement and verify mentions!
            </p>
          </div>

          <a
            href={officialLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-all whitespace-nowrap"
          >
            <span>Visit Official X Account</span>
            <Twitter className="w-4 h-4 text-blue-300" />
          </a>
        </div>
      </div>

      {/* Success Notification */}
      {success && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3 shadow-xs">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Promotion Submitted & AI Verified!</span>
          </div>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Your tweet link has been successfully recorded in the system with verified engagement metrics. Administrators will review and approve your reward payout.
          </p>
          <div className="pt-2 flex gap-3">
            <button
              onClick={() => onSelectTab('history')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              View Submission History
            </button>
            <button
              onClick={() => setSuccess(false)}
              className="px-4 py-2 bg-white text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-300"
            >
              Submit Another Post
            </button>
          </div>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              readOnly
              value="TripToCoin"
              className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 cursor-not-allowed"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                X (Twitter) Post URL *
              </label>
              <div className="flex items-center gap-2 text-[10px] font-bold">
                 <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">View: ${settings.rewardPerView}</span>
                 <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Like: ${settings.rewardPerLike}</span>
                 <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Repost: ${settings.rewardPerRepost}</span>
              </div>
            </div>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="url"
                required
                value={tweetUrl}
                onChange={(e) => {
                  setTweetUrl(e.target.value);
                  setAiVerified(false);
                  setAiMetrics(null);
                }}
                placeholder="https://x.com/your_username/status/1234567890"
                className="w-full pl-10 pr-28 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
              />
              <button
                type="button"
                onClick={handleAiVerification}
                disabled={analyzing || !tweetUrl.trim()}
                className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5 text-amber-300" />
                    <span>AI Verify</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Example: https://x.com/TripToCoin/status/18123456789 or https://x.com/user/status/123456
            </p>
          </div>

          {/* AI Verification Results Box */}
          {aiMetrics && (
            <div className={`p-4 rounded-xl border space-y-4 animate-fade-in shadow-xs ${
              aiMetrics.officialMentioned 
                ? 'bg-gradient-to-r from-indigo-50/80 via-blue-50/80 to-slate-50 border-indigo-200' 
                : 'bg-rose-50/60 border-rose-200'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/80 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className={`w-5 h-5 ${aiMetrics.officialMentioned ? 'text-indigo-600' : 'text-rose-600'}`} />
                  <div>
                    <span className="font-extrabold text-xs text-indigo-950 block">AI Twitter Post Verification</span>
                    {aiMetrics.authorHandle && (
                      <span className="text-[11px] text-slate-500 font-mono">Author: {aiMetrics.authorName} ({aiMetrics.authorHandle})</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {aiMetrics.officialMentioned ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Verified @TripToCoin Mention
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 border border-rose-200">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Mention Missing
                    </span>
                  )}
                </div>
              </div>

              {!aiMetrics.officialMentioned && (
                <div className="p-3 bg-rose-100/80 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-950">@TripToCoin or #TripToCoin Mention Not Found!</span>
                    <span className="text-rose-800 text-[11px] leading-relaxed block mt-0.5">
                      The text of this tweet does not mention <strong>@TripToCoin</strong> or <strong>#TripToCoin</strong>. Posts without an official mention show <strong>0 views, 0 likes, 0 reposts, and $0.00 USD reward</strong>.
                    </span>
                  </div>
                </div>
              )}

              {aiMetrics.tweetText && (
                <div className="p-3 bg-white/90 rounded-lg border border-indigo-100 text-xs text-slate-700 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Fetched Tweet Content Snippet</span>
                  <p className="italic font-sans text-slate-800 leading-relaxed">"{aiMetrics.tweetText}"</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-slate-700">Verified & Recordable Engagement Metrics:</span>
                  {aiMetrics.officialMentioned && (
                    <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50/90 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-indigo-500" />
                      Type Views, Likes, and Reposts manually (Calculated Reward will update automatically)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
                    <div className="flex items-center justify-center space-x-1 text-slate-500 text-[10px] font-bold mb-1">
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                      <span>Views</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      readOnly={!aiMetrics.officialMentioned}
                      value={aiMetrics.views ?? 0}
                      onChange={(e) => handleMetricChange('views', Number(e.target.value))}
                      className="w-full text-center font-extrabold text-slate-900 text-sm bg-slate-50 border border-slate-200 rounded-lg py-1 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
                    <div className="flex items-center justify-center space-x-1 text-slate-500 text-[10px] font-bold mb-1">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Likes</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      readOnly={!aiMetrics.officialMentioned}
                      value={aiMetrics.likes ?? 0}
                      onChange={(e) => handleMetricChange('likes', Number(e.target.value))}
                      className="w-full text-center font-extrabold text-slate-900 text-sm bg-slate-50 border border-slate-200 rounded-lg py-1 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
                    <div className="flex items-center justify-center space-x-1 text-slate-500 text-[10px] font-bold mb-1">
                      <Repeat className="w-3.5 h-3.5 text-amber-500" />
                      <span>Reposts</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      readOnly={!aiMetrics.officialMentioned}
                      value={aiMetrics.reposts ?? 0}
                      onChange={(e) => handleMetricChange('reposts', Number(e.target.value))}
                      className="w-full text-center font-extrabold text-slate-900 text-sm bg-slate-50 border border-slate-200 rounded-lg py-1 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
                    <div className="flex items-center justify-center space-x-1 text-slate-500 text-[10px] font-bold mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Calculated Reward</span>
                    </div>
                    <div className={`py-1 rounded-lg text-center font-extrabold text-sm border ${
                      aiMetrics.officialMentioned && aiMetrics.estimatedReward > 0
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}>
                      ${aiMetrics.estimatedReward.toFixed(2)} USD
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Optional Note / Details for Admin
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="E.g., Highlighted TripToCoin utility and community growth. Over 1,000 views!"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Requirements Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="font-bold text-slate-800 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Submission & AI Guidelines:</span>
          </div>
          <ul className="list-disc list-inside text-slate-600 space-y-1 pl-1">
            <li>Post must explicitly mention <strong>TripToCoin</strong> or tag official handle <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">@TripToCoin</code>.</li>
            <li>Post must be public and active on Twitter/X.</li>
            <li>AI system detects views, likes, and reposts to calculate optimal reward payout.</li>
            <li>Duplicate post URLs will be automatically rejected.</li>
          </ul>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting Link...' : 'Submit Link for Review'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
