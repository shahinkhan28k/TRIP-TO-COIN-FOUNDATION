import React, { useEffect, useState } from 'react';
import { CreditCard, ExternalLink, Copy, Check, DollarSign, Wallet, Calendar, ShieldCheck, Coins, PlusCircle, Clock } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { PaymentRecord, Submission, SystemSettings } from '../types';
import { WithdrawalModal } from './WithdrawalModal';

export const PaymentsView: React.FC = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [minPayoutUsd, setMinPayoutUsd] = useState<number>(10);

  useEffect(() => {
    if (!user) return;

    // Fetch System Settings for Min Payout
    const fetchSettings = async () => {
      try {
        const sSnap = await getDoc(doc(db, 'settings', 'global'));
        if (sSnap.exists()) {
          setMinPayoutUsd(sSnap.data()?.minPayoutUsd || 10);
        }
      } catch (err) {
        console.error('Settings load error:', err);
      }
    };
    fetchSettings();

    // Listen to user's payments
    const qPay = query(
      collection(db, 'payments'),
      where('uid', '==', user.uid)
    );

    const unsubPay = onSnapshot(qPay, (snapshot) => {
      const list: PaymentRecord[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as PaymentRecord);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPayments(list);
      setLoading(false);
    }, (err) => {
      console.error('Payments snapshot error:', err);
      setLoading(false);
    });

    // Listen to user's approved submissions for reward calculations
    const qSub = query(
      collection(db, 'submissions'),
      where('uid', '==', user.uid)
    );

    const unsubSub = onSnapshot(qSub, (snapshot) => {
      const list: Submission[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Submission);
      });
      setSubmissions(list);
    }, (err) => {
      console.warn('Payments view submissions snapshot error:', err);
    });

    return () => {
      unsubPay();
      unsubSub();
    };
  }, [user]);

  const handleCopy = (txHash: string, id: string) => {
    navigator.clipboard.writeText(txHash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Calculations
  const totalApprovedRewards = submissions
    .filter(s => s.status === 'approved')
    .reduce((sum, s) => sum + (s.rewardAmount || 0), 0);

  const totalPaidOut = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingWithdrawals = payments
    .filter(p => p.status === 'Processing')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const availableBalance = Math.max(0, totalApprovedRewards - totalPaidOut - pendingWithdrawals);

  return (
    <div className="space-y-6">
      {/* Header & Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold mb-2 border border-white/20">
            <Coins className="w-3.5 h-3.5 text-amber-300" />
            <span>TripToCoin Reward Balance & Withdrawal Center</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Payments & Withdrawals</h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
            Withdraw your earned promotional rewards directly to your USDT BEP-20 or USDT ARB wallet address.
          </p>
        </div>

        <button
          onClick={() => setShowWithdrawModal(true)}
          className="inline-flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 text-sm cursor-pointer whitespace-nowrap"
        >
          <Coins className="w-5 h-5" />
          <span>Request Withdrawal</span>
        </button>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Earned</span>
          <span className="text-2xl font-extrabold text-slate-900">${totalApprovedRewards.toFixed(2)}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">From approved posts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Paid Out</span>
          <span className="text-2xl font-extrabold text-emerald-600">${totalPaidOut.toFixed(2)}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">On-chain payouts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Pending Payouts</span>
          <span className="text-2xl font-extrabold text-amber-600">${pendingWithdrawals.toFixed(2)}</span>
          <span className="text-[11px] text-slate-400 block mt-0.5">In processing</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-xs">
          <span className="text-xs font-bold text-blue-800 block mb-1">Available to Withdraw</span>
          <span className="text-2xl font-extrabold text-blue-700">${availableBalance.toFixed(2)}</span>
          <span className="text-[11px] text-blue-500 block mt-0.5">Min threshold: ${minPayoutUsd} USD</span>
        </div>
      </div>

      {/* Payment Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Withdrawal & Payment Records</h2>
            <p className="text-xs text-slate-500">History of requested payouts and verified transaction hashes</p>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>On-Chain Verified</span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Loading payout records...
          </div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center space-y-3 border-2 border-dashed border-slate-200 rounded-xl">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <p className="text-slate-700 font-bold text-sm">No payment records found</p>
              <p className="text-xs text-slate-400 mt-1">Once you request a withdrawal or admins issue a payout, records will appear here.</p>
            </div>
            {availableBalance >= minPayoutUsd && (
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="inline-flex items-center space-x-2 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-emerald-500 transition-colors shadow-xs"
              >
                <Coins className="w-4 h-4" />
                <span>Withdraw ${availableBalance.toFixed(2)} Now</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Network</th>
                  <th className="px-6 py-3.5">Wallet Address</th>
                  <th className="px-6 py-3.5">Transaction Hash (TxHash)</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-slate-900 text-sm">${pay.amount} USD</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded font-mono text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {pay.network || 'USDT BEP-20'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 max-w-[180px] truncate">
                      {pay.wallet}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {pay.txHash === 'Pending Verification' ? (
                        <span className="text-amber-600 text-[11px] font-sans font-bold italic flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Awaiting Admin TxHash</span>
                        </span>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="truncate max-w-[160px]">{pay.txHash}</span>
                          <button
                            onClick={() => handleCopy(pay.txHash, pay.id)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Copy Tx Hash"
                          >
                            {copiedId === pay.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={`https://bscscan.com/tx/${pay.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="View on Explorer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {pay.paymentDate || new Date(pay.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        pay.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : pay.status === 'Processing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {pay.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
