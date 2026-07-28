import React, { useEffect, useState } from 'react';
import { Award, Coins, DollarSign, Wallet, CheckCircle2, Clock, ArrowUpRight, HelpCircle } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Submission, PaymentRecord, NavigationTab } from '../types';

interface RewardsViewProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const RewardsView: React.FC<RewardsViewProps> = ({ onSelectTab }) => {
  const { user, userProfile } = useAuth();
  const [approvedSubmissions, setApprovedSubmissions] = useState<Submission[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;

    // Fetch approved submissions
    const qSub = query(
      collection(db, 'submissions'),
      where('uid', '==', user.uid)
    );

    const unsubSub = onSnapshot(qSub, (snapshot) => {
      const list: Submission[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Submission;
        if (data.status === 'approved') {
          list.push({ id: doc.id, ...data });
        }
      });
      setApprovedSubmissions(list);
      setLoading(false);
    }, (err) => {
      console.warn('Rewards view submissions snapshot error:', err);
      setLoading(false);
    });

    // Fetch payments
    const qPay = query(
      collection(db, 'payments'),
      where('uid', '==', user.uid)
    );

    const unsubPay = onSnapshot(qPay, (snapshot) => {
      const list: PaymentRecord[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as PaymentRecord);
      });
      setPayments(list);
    }, (err) => {
      console.warn('Rewards view payments snapshot error:', err);
    });

    return () => {
      unsubSub();
      unsubPay();
    };
  }, [user]);

  const totalRewards = approvedSubmissions.reduce((sum, s) => sum + (s.rewardAmount || 0), 0);
  const totalPaid = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPayout = Math.max(0, totalRewards - totalPaid);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 text-white rounded-2xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <Award className="w-6 h-6 text-amber-300" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold">TripToCoin Rewards Overview</h1>
        </div>
        <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
          Earn crypto rewards for every approved promotional post. Payments are processed regularly to your registered wallet address.
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
            <span className="text-xs text-emerald-100 font-semibold block">Total Rewards Earned</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">${totalRewards} USD</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
            <span className="text-xs text-emerald-100 font-semibold block">Total Paid Out</span>
            <span className="text-2xl font-extrabold text-amber-300 mt-1 block">${totalPaid} USD</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
            <span className="text-xs text-emerald-100 font-semibold block">Pending Payout</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">${pendingPayout} USD</span>
          </div>
        </div>
      </div>

      {/* Wallet Destination Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Payout Destination Wallet</h3>
            <p className="text-xs font-mono text-slate-500 mt-0.5">
              {userProfile?.wallet || 'No wallet address configured yet!'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectTab('profile')}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
        >
          {userProfile?.wallet ? 'Update Wallet' : 'Set Wallet Address'}
        </button>
      </div>

      {/* Approved Submissions Breakdowns */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Approved Posts & Rewards</h2>
        <p className="text-xs text-slate-500 mb-5">Individual rewards assigned to your approved tweets</p>

        {loading ? (
          <p className="text-center text-slate-400 text-sm py-8">Loading reward history...</p>
        ) : approvedSubmissions.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
            <Coins className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-semibold text-sm">No approved reward posts yet.</p>
            <p className="text-xs text-slate-400 mt-1">Submit your promotional posts on X to get reviewed and start earning.</p>
            <button
              onClick={() => onSelectTab('submit')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-500 transition-colors"
            >
              Submit Post Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {approvedSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <a
                    href={sub.tweetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{sub.tweetUrl}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-1">
                    <span>Likes: {sub.likes || 0}</span>
                    <span>Reposts: {sub.reposts || 0}</span>
                    <span>Approved on: {new Date(sub.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-sm font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    +${sub.rewardAmount || 0} USD
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {sub.paymentStatus || 'unpaid'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
