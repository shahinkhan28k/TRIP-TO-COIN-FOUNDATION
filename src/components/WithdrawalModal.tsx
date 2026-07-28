import React, { useState, useEffect } from 'react';
import { X, Wallet, ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, DollarSign, Coins } from 'lucide-react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  minPayoutUsd?: number;
  onSuccess?: () => void;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  minPayoutUsd = 10,
  onSuccess
}) => {
  const { user, userProfile } = useAuth();

  const [network, setNetwork] = useState<'USDT BEP-20' | 'USDT ARB'>('USDT BEP-20');
  const [wallet, setWallet] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (userProfile) {
      if (network === 'USDT BEP-20') {
        setWallet(userProfile.walletBep20 || userProfile.wallet || '');
      } else {
        setWallet(userProfile.walletArb || userProfile.wallet || '');
      }
    }
  }, [userProfile, network]);

  useEffect(() => {
    if (availableBalance >= minPayoutUsd) {
      setAmount(Math.floor(availableBalance * 100) / 100);
    } else {
      setAmount(minPayoutUsd);
    }
  }, [availableBalance, minPayoutUsd]);

  if (!isOpen) return null;

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!user) {
      setErrorMsg('You must be signed in to request a withdrawal.');
      return;
    }

    if (!wallet || wallet.trim().length < 10) {
      setErrorMsg(`Please enter a valid ${network} wallet address.`);
      return;
    }

    if (amount < minPayoutUsd) {
      setErrorMsg(`Minimum withdrawal amount is $${minPayoutUsd} USD.`);
      return;
    }

    if (amount > availableBalance) {
      setErrorMsg(`Insufficient balance. Maximum withdrawable amount is $${availableBalance.toFixed(2)} USD.`);
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create Payout Request in Firestore 'payments'
      await addDoc(collection(db, 'payments'), {
        uid: user.uid,
        userEmail: user.email || '',
        userFullName: userProfile?.fullName || 'Promoter',
        amount: Number(amount),
        wallet: wallet.trim(),
        network: network,
        txHash: 'Pending Verification',
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'Processing',
        requestType: 'withdrawal',
        createdAt: new Date().toISOString()
      });

      // 2. Save/Update wallet in User Profile if it wasn't saved yet
      if (userProfile) {
        const userRef = doc(db, 'users', user.uid);
        const updateData: any = {};
        if (network === 'USDT BEP-20' && (!userProfile.walletBep20 || userProfile.walletBep20 !== wallet.trim())) {
          updateData.walletBep20 = wallet.trim();
        } else if (network === 'USDT ARB' && (!userProfile.walletArb || userProfile.walletArb !== wallet.trim())) {
          updateData.walletArb = wallet.trim();
        }
        if (Object.keys(updateData).length > 0) {
          await updateDoc(userRef, updateData);
        }
      }

      setSuccessMsg(`Withdrawal request of $${amount} USD submitted successfully! Our administrators will review and process your payout on-chain.`);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 2500);

    } catch (err: any) {
      console.error('Error submitting withdrawal request:', err);
      setErrorMsg(err?.message || 'Failed to submit withdrawal request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-fade-in my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Coins className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Withdraw Earnings</h2>
              <p className="text-blue-100 text-xs">Request payout for approved TripToCoin rewards</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleWithdrawal} className="p-6 space-y-5">
          {/* Balance Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Available Withdrawable Balance
              </span>
              <span className="text-2xl font-extrabold text-emerald-600">
                ${availableBalance.toFixed(2)} USD
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-400 block">Min Withdrawal</span>
              <span className="text-xs font-bold text-slate-700">${minPayoutUsd} USD</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Network Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Select Payout Network *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNetwork('USDT BEP-20')}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex flex-col justify-between ${
                  network === 'USDT BEP-20'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>USDT BEP-20</span>
                <span className="text-[10px] font-normal text-slate-500 mt-1">BNB Smart Chain</span>
              </button>

              <button
                type="button"
                onClick={() => setNetwork('USDT ARB')}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex flex-col justify-between ${
                  network === 'USDT ARB'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>USDT ARB</span>
                <span className="text-[10px] font-normal text-slate-500 mt-1">Arbitrum One</span>
              </button>
            </div>
          </div>

          {/* Wallet Address Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              {network} Destination Wallet Address *
            </label>
            <div className="relative">
              <Wallet className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder={network === 'USDT BEP-20' ? 'Enter 0x... BEP-20 address' : 'Enter 0x... ARB address'}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-700">
                Withdrawal Amount ($ USD) *
              </label>
              <button
                type="button"
                onClick={() => setAmount(Math.floor(availableBalance * 100) / 100)}
                className="text-[11px] text-blue-600 font-bold hover:underline"
              >
                Max Amount (${availableBalance.toFixed(2)})
              </button>
            </div>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="number"
                step="0.01"
                min={minPayoutUsd}
                max={availableBalance}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 space-y-1">
            <span className="font-bold block">Important Note:</span>
            <p className="text-amber-800 leading-normal">
              Once submitted, your withdrawal request will enter processing. Administrators will execute the transfer on-chain and post the transaction hash (TxHash).
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || availableBalance < minPayoutUsd}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Submitting Request...' : 'Submit Withdrawal Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
