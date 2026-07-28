import React, { useEffect, useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  DollarSign, 
  ExternalLink, 
  PlusCircle, 
  TrendingUp, 
  Sparkles,
  Coins,
  ArrowRight,
  Wallet
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Submission, PaymentRecord, NavigationTab } from '../types';
import { WithdrawalModal } from './WithdrawalModal';

interface DashboardViewProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onSelectTab }) => {
  const { user, userProfile } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [minPayoutUsd, setMinPayoutUsd] = useState<number>(10);

  useEffect(() => {
    if (!user) return;

    // Fetch min payout threshold setting
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'global'));
        if (snap.exists()) {
          setMinPayoutUsd(snap.data()?.minPayoutUsd || 10);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();

    // Listen to user's submissions
    const qSub = query(collection(db, 'submissions'), where('uid', '==', user.uid));
    const unsubSub = onSnapshot(qSub, (snapshot) => {
      const list: Submission[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Submission);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSubmissions(list);
      setLoading(false);
    }, (err) => {
      console.error('Submissions snapshot error:', err);
      setLoading(false);
    });

    // Listen to user's payments
    const qPay = query(collection(db, 'payments'), where('uid', '==', user.uid));
    const unsubPay = onSnapshot(qPay, (snapshot) => {
      const list: PaymentRecord[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as PaymentRecord);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPayments(list);
    }, (err) => {
      console.error('Payments snapshot error:', err);
    });

    return () => {
      unsubSub();
      unsubPay();
    };
  }, [user]);

  // Metric Calculations
  const totalSubmitted = submissions.length;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  const totalRewardsEarned = submissions
    .filter(s => s.status === 'approved')
    .reduce((sum, s) => sum + (s.rewardAmount || 0), 0);

  const totalPaid = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingPayouts = payments
    .filter(p => p.status === 'Processing')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const availableBalance = Math.max(0, totalRewardsEarned - totalPaid - pendingPayouts);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-blue-600/10">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-100 mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>TripToCoin Promoter Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome to TripToCoin, {userProfile?.fullName || 'Promoter'}!
            </h1>
            <p className="mt-2 text-blue-100 text-sm max-w-xl leading-relaxed">
              Publish promotional posts on X (Twitter), submit your tweet links, track your post engagement, and claim your rewards.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onSelectTab('submit')}
              className="inline-flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-xs cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Promotion</span>
            </button>

            <button
              onClick={() => setShowWithdrawModal(true)}
              className="inline-flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-5 py-3 rounded-xl backdrop-blur-xs transition-all text-xs cursor-pointer whitespace-nowrap"
            >
              <Coins className="w-4 h-4 text-amber-300" />
              <span>Withdraw (${availableBalance.toFixed(2)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Submitted</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{totalSubmitted}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Posts</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Pending Review</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-amber-600">{pendingCount}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Awaiting approval</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Approved Posts</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600">{approvedCount}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Eligible for rewards</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Rejected Posts</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-rose-600">{rejectedCount}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Needs revision</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Rewards</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">${totalRewardsEarned.toFixed(2)}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Approved value</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-900">Withdrawable</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-700">${availableBalance.toFixed(2)}</span>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="text-[11px] text-emerald-600 font-bold block mt-0.5 hover:underline text-left cursor-pointer"
            >
              Withdraw Funds →
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Submissions</h2>
              <p className="text-xs text-slate-500">Your latest promotional tweets and review status</p>
            </div>
            <button
              onClick={() => onSelectTab('history')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <Send className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 font-medium text-sm">No promotional submissions yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Post on X about TripToCoin and submit your link to earn.</p>
              <button
                onClick={() => onSelectTab('submit')}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
              >
                <span>Submit Your First Tweet</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.slice(0, 5).map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 truncate">{sub.projectName} Post</span>
                      <a
                        href={sub.tweetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-700 inline-flex items-center text-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-xs text-slate-500 truncate font-mono">{sub.tweetUrl}</p>
                    <div className="flex items-center space-x-3 mt-2 text-[11px] text-slate-500">
                      <span>Likes: {sub.likes || 0}</span>
                      <span>Reposts: {sub.reposts || 0}</span>
                      <span>Views: {sub.views || 0}</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1">
                    {sub.status === 'approved' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Approved (+${sub.rewardAmount || 0})
                      </span>
                    )}
                    {sub.status === 'pending' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Pending Review
                      </span>
                    )}
                    {sub.status === 'rejected' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Rejected
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Widget: Wallet & Quick Payout Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              <span>Reward Payout Addresses</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block mb-0.5">USDT BEP-20 (BNB Chain)</span>
                <p className="font-mono text-slate-800 font-bold truncate">
                  {userProfile?.walletBep20 || userProfile?.wallet || 'Not configured'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block mb-0.5">USDT ARB (Arbitrum)</span>
                <p className="font-mono text-slate-800 font-bold truncate">
                  {userProfile?.walletArb || 'Not configured'}
                </p>
              </div>

              <button
                onClick={() => onSelectTab('profile')}
                className="w-full text-center py-2 text-blue-600 hover:underline font-bold text-xs bg-blue-50 rounded-xl transition-colors block mt-2"
              >
                Edit Wallet Addresses →
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
              <button
                onClick={() => onSelectTab('payments')}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                All Payments
              </button>
            </div>

            {payments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No payment transactions recorded yet.</p>
            ) : (
              <div className="space-y-2.5">
                {payments.slice(0, 3).map((pay) => (
                  <div key={pay.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800">${pay.amount} USD</span>
                      <span className="block text-[10px] text-slate-400 font-mono truncate max-w-[130px]">
                        Tx: {pay.txHash}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      pay.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : pay.status === 'Processing'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {pay.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        availableBalance={availableBalance}
        minPayoutUsd={minPayoutUsd}
      />
    </div>
  );
};
