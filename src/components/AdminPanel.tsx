import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  DollarSign, 
  Search, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  CreditCard, 
  PlusCircle,
  ThumbsUp,
  MessageCircle,
  Repeat,
  Bookmark,
  Eye,
  RefreshCw,
  Coins,
  Trash2,
  Settings,
  Award,
  Send,
  LayoutDashboard,
  LogOut,
  AlertTriangle,
  Megaphone,
  Save,
  Check,
  Sparkles,
  UserPlus,
  UserMinus,
  Shield,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Submission, UserProfile, PaymentRecord, SystemSettings, NavigationTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchTweetMetrics } from '../lib/twitter';
import { compressImageToDataUrl } from '../lib/imageUtils';

interface AdminPanelProps {
  onExitAdmin?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onExitAdmin }) => {
  const { user, userProfile, updateSystemSettings } = useAuth();
  
  // Admin Sections corresponding to all 7 website modules
  const [activeAdminTab, setActiveAdminTab] = useState<
    'dashboard' | 'users' | 'submit' | 'history' | 'rewards' | 'payments' | 'settings'
  >('dashboard');

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  // Admin Management State
  const [newAdminEmailInput, setNewAdminEmailInput] = useState<string>('');
  const [adminMgmtMsg, setAdminMgmtMsg] = useState<string>('');

  // Global Settings State
  const [settings, setSettings] = useState<SystemSettings>({
    siteLogoUrl: '',
    minPayoutUsd: 10,
    rewardPerView: 0.002,
    rewardPerLike: 0.005,
    rewardPerRepost: 0.5,
    usdtBep20Contract: '0x55d398326f99059fF775485246999027B3197955',
    usdtArbContract: '0xFd086bC7cd5C481DCC9C85ebE478A1C0b69FCbb9',
    maintenanceMode: false,
    announcementBanner: 'Welcome to TripToCoin Rewards! Earn USDT for promoting our token on X.',
    supportTelegram: '@triptocoin_support',
    officialTwitterAccount: 'https://x.com/TripToCoin'
  });
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [settingsMsg, setSettingsMsg] = useState<string>('');

  // Modals & Form States
  // 1. User Edit Modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // 2. Add User Modal
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    telegram: '',
    whatsapp: '',
    twitter: '',
    walletBep20: '',
    walletArb: '',
    country: 'United States',
    role: 'user' as 'user' | 'admin'
  });

  // 3. Review Submission Modal (Approve / Reject)
  const [editingSub, setEditingSub] = useState<Submission | null>(null);
  const [rewardInput, setRewardInput] = useState<number>(10);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');

  // 4. Edit Submission Details Modal
  const [detailEditingSub, setDetailEditingSub] = useState<Submission | null>(null);

  // 5. Engagement Edit Modal
  const [engagementSub, setEngagementSub] = useState<Submission | null>(null);
  const [engagementData, setEngagementData] = useState({
    likes: 0,
    replies: 0,
    reposts: 0,
    bookmarks: 0,
    views: 0
  });

  // 6. Manual Submit Promotion Modal (Admin adding submission)
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [manualSub, setManualSub] = useState({
    uid: '',
    userEmail: '',
    tweetUrl: '',
    likes: 100,
    views: 1000,
    reposts: 20,
    rewardAmount: 10,
    status: 'approved' as 'pending' | 'approved' | 'rejected',
    note: 'Admin added submission'
  });

  // 7. Record / Edit Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    uid: '',
    userEmail: '',
    submissionId: '',
    amount: 10,
    wallet: '',
    network: 'USDT BEP-20' as 'USDT BEP-20' | 'USDT ARB',
    txHash: '',
    paymentDate: new Date().toISOString().split('T')[0],
    status: 'Paid' as 'Paid' | 'Processing' | 'Failed'
  });

  // 8. Custom Bonus Reward Modal
  const [showBonusModal, setShowBonusModal] = useState<boolean>(false);
  const [bonusForm, setBonusForm] = useState({
    uid: '',
    userEmail: '',
    amount: 15,
    reason: 'Top Weekly Promoter Bonus'
  });

  useEffect(() => {
    // Submissions Listener
    const unsubSub = onSnapshot(collection(db, 'submissions'), (snapshot) => {
      const list: Submission[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Submission);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSubmissions(list);
      setLoading(false);
    }, (err) => {
      console.warn('Submissions snapshot listener error:', err);
      setLoading(false);
    });

    // Users Listener
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        list.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(list);
    }, (err) => {
      console.warn('Users snapshot listener error:', err);
    });

    // Payments Listener
    const unsubPayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
      const list: PaymentRecord[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as PaymentRecord);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPayments(list);
    }, (err) => {
      console.warn('Payments snapshot listener error:', err);
    });

    // System Settings Fetch
    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'global');
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          setSettings(snap.data() as SystemSettings);
        }
      } catch (e) {
        console.error('Error fetching global settings:', e);
      }
    };
    fetchSettings();

    return () => {
      unsubSub();
      unsubUsers();
      unsubPayments();
    };
  }, []);

  // --- ACTIONS & HANDLERS --- //

  // Save System Settings
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSettingsMsg('');
    try {
      let settingsToSave = { ...settings };
      if (settingsToSave.siteLogoUrl && settingsToSave.siteLogoUrl.startsWith('data:image/') && settingsToSave.siteLogoUrl.length > 100000) {
        settingsToSave.siteLogoUrl = await compressImageToDataUrl(settingsToSave.siteLogoUrl, 160, 0.85);
      }
      const settingsRef = doc(db, 'settings', 'global');
      await setDoc(settingsRef, settingsToSave, { merge: true });
      setSettingsMsg('System Settings updated successfully!');
      setTimeout(() => setSettingsMsg(''), 4000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings: ' + (err?.message || 'Database error'));
    } finally {
      setSavingSettings(false);
    }
  };

  // User CRUD
  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    try {
      const userRef = doc(db, 'users', editingUser.uid);
      await updateDoc(userRef, {
        fullName: editingUser.fullName,
        email: editingUser.email,
        telegram: editingUser.telegram || '',
        whatsapp: editingUser.whatsapp || '',
        twitter: editingUser.twitter || '',
        walletBep20: editingUser.walletBep20 || '',
        walletArb: editingUser.walletArb || '',
        wallet: editingUser.walletBep20 || editingUser.wallet || '',
        country: editingUser.country || '',
        role: editingUser.role
      });
      setEditingUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Error updating user profile.');
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this user profile? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user.');
    }
  };

  // Admin Role Management Handlers
  const handleToggleAdminRole = async (targetUser: UserProfile, newRole: 'admin' | 'user') => {
    if (targetUser.email.toLowerCase() === 'shahinkhan28aa@gmail.com' && newRole === 'user') {
      alert('Primary owner admin (shahinkhan28aa@gmail.com) cannot be revoked.');
      return;
    }
    try {
      const userRef = doc(db, 'users', targetUser.uid);
      await updateDoc(userRef, { role: newRole });
      setAdminMgmtMsg(`User ${targetUser.email} role updated to ${newRole.toUpperCase()}.`);
      setTimeout(() => setAdminMgmtMsg(''), 4000);
    } catch (e) {
      console.error('Error updating admin role:', e);
      alert('Failed to update user role.');
    }
  };

  const handleSetAdminByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToGrant = newAdminEmailInput.trim().toLowerCase();
    if (!emailToGrant) return;

    const existingUser = users.find(u => u.email.toLowerCase() === emailToGrant);
    if (existingUser) {
      try {
        await updateDoc(doc(db, 'users', existingUser.uid), { role: 'admin' });
        setAdminMgmtMsg(`Successfully granted Admin role to registered user ${emailToGrant}!`);
        setNewAdminEmailInput('');
        setTimeout(() => setAdminMgmtMsg(''), 5000);
      } catch (err) {
        console.error('Error granting admin role:', err);
        alert('Failed to update admin role.');
      }
    } else {
      const newUid = 'admin_' + Date.now();
      try {
        await setDoc(doc(db, 'users', newUid), {
          uid: newUid,
          email: emailToGrant,
          fullName: emailToGrant.split('@')[0],
          role: 'admin',
          telegram: '',
          whatsapp: '',
          twitter: '',
          walletBep20: '',
          walletArb: '',
          country: '',
          createdAt: new Date().toISOString()
        });
        setAdminMgmtMsg(`Admin record created for ${emailToGrant}! When they sign in with Google, they will automatically gain full Admin Panel access.`);
        setNewAdminEmailInput('');
        setTimeout(() => setAdminMgmtMsg(''), 6000);
      } catch (err) {
        console.error('Error creating pre-grant admin profile:', err);
        alert('Failed to save admin record.');
      }
    }
  };

  const handleAdminLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImageToDataUrl(file, 160, 0.85);
      setSettings(prev => ({ ...prev, siteLogoUrl: compressedDataUrl }));
    } catch (err) {
      console.error('Error compressing image:', err);
      alert('Failed to process image file.');
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.fullName) {
      alert('Please fill out Name and Email.');
      return;
    }
    const generatedUid = 'user_' + Date.now();
    try {
      await setDoc(doc(db, 'users', generatedUid), {
        uid: generatedUid,
        ...newUser,
        wallet: newUser.walletBep20 || '',
        createdAt: new Date().toISOString()
      });
      setShowAddUserModal(false);
      setNewUser({
        fullName: '',
        email: '',
        telegram: '',
        whatsapp: '',
        twitter: '',
        walletBep20: '',
        walletArb: '',
        country: 'United States',
        role: 'user'
      });
    } catch (err) {
      console.error('Error adding user:', err);
    }
  };

  // Submission CRUD & Decision
  const handleApprove = async (sub: Submission) => {
    try {
      const subRef = doc(db, 'submissions', sub.id);
      await updateDoc(subRef, {
        status: 'approved',
        rewardAmount: Number(rewardInput),
        paymentStatus: 'pending',
        lastUpdated: new Date().toISOString()
      });
      setEditingSub(null);
    } catch (err) {
      console.error('Error approving submission:', err);
    }
  };

  const handleReject = async (sub: Submission) => {
    try {
      const subRef = doc(db, 'submissions', sub.id);
      await updateDoc(subRef, {
        status: 'rejected',
        rejectionReason: rejectionReasonInput || 'Does not comply with promotional rules.',
        lastUpdated: new Date().toISOString()
      });
      setEditingSub(null);
    } catch (err) {
      console.error('Error rejecting submission:', err);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission entry?')) return;
    try {
      await deleteDoc(doc(db, 'submissions', id));
    } catch (err) {
      console.error('Error deleting submission:', err);
    }
  };

  const handleSaveDetailSubEdit = async () => {
    if (!detailEditingSub) return;
    try {
      const subRef = doc(db, 'submissions', detailEditingSub.id);
      await updateDoc(subRef, {
        tweetUrl: detailEditingSub.tweetUrl,
        status: detailEditingSub.status,
        rewardAmount: Number(detailEditingSub.rewardAmount),
        paymentStatus: detailEditingSub.paymentStatus,
        note: detailEditingSub.note || '',
        lastUpdated: new Date().toISOString()
      });
      setDetailEditingSub(null);
    } catch (err) {
      console.error('Error updating submission details:', err);
    }
  };

  const handleSaveEngagement = async () => {
    if (!engagementSub) return;
    try {
      const subRef = doc(db, 'submissions', engagementSub.id);
      await updateDoc(subRef, {
        likes: Number(engagementData.likes),
        replies: Number(engagementData.replies),
        reposts: Number(engagementData.reposts),
        bookmarks: Number(engagementData.bookmarks),
        views: Number(engagementData.views),
        lastUpdated: new Date().toISOString()
      });
      setEngagementSub(null);
    } catch (err) {
      console.error('Error updating engagement:', err);
    }
  };

  const handleSyncEngagementModal = async () => {
    if (!engagementSub || !engagementSub.tweetUrl) return;
    try {
      const details = await fetchTweetMetrics(engagementSub.tweetUrl, settings.officialTwitterAccount || 'TripToCoin');
      setEngagementData({
        likes: details.likes,
        replies: details.replies,
        reposts: details.reposts,
        bookmarks: engagementData.bookmarks || 0,
        views: details.views
      });
    } catch (e: any) {
      alert('Error fetching live Twitter data: ' + e.message);
    }
  };

  const handleSyncEngagement = async () => {
    if (!manualSub.tweetUrl) {
      alert('Please enter a Twitter/X post URL first.');
      return;
    }
    try {
      const details = await fetchTweetMetrics(manualSub.tweetUrl, settings.officialTwitterAccount || 'TripToCoin');
      
      const vReward = details.views * (settings.rewardPerView || 0.002);
      const lReward = details.likes * (settings.rewardPerLike || 0.005);
      const rReward = details.reposts * (settings.rewardPerRepost || 0.5);
      const calculatedReward = Math.max(1.0, Math.round((vReward + lReward + rReward) * 100) / 100);

      setManualSub(prev => ({
        ...prev,
        views: details.views,
        likes: details.likes,
        reposts: details.reposts,
        replies: details.replies,
        rewardAmount: calculatedReward
      }));
    } catch (err: any) {
      console.error('Error syncing Twitter engagement:', err);
      alert(err?.message || 'Failed to sync Twitter metrics.');
    }
  };

  const handleManualSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSub.userEmail || !manualSub.tweetUrl) {
      alert('Please fill out User Email and Tweet URL.');
      return;
    }
    const matchedUser = users.find(u => u.email.toLowerCase() === manualSub.userEmail.toLowerCase());
    try {
      await addDoc(collection(db, 'submissions'), {
        uid: matchedUser?.uid || 'admin_added',
        userEmail: manualSub.userEmail,
        userFullName: matchedUser?.fullName || 'Promoter',
        projectName: 'TripToCoin',
        tweetUrl: manualSub.tweetUrl,
        likes: Number(manualSub.likes),
        replies: 0,
        reposts: Number(manualSub.reposts),
        bookmarks: 0,
        views: Number(manualSub.views),
        status: manualSub.status,
        rewardAmount: Number(manualSub.rewardAmount),
        paymentStatus: manualSub.status === 'approved' ? 'pending' : 'unpaid',
        note: manualSub.note,
        createdAt: new Date().toISOString()
      });
      setShowSubmitModal(false);
      setManualSub({
        uid: '',
        userEmail: '',
        tweetUrl: '',
        likes: 100,
        views: 1000,
        reposts: 20,
        rewardAmount: 10,
        status: 'approved',
        note: 'Admin added submission'
      });
    } catch (err) {
      console.error('Error adding manual submission:', err);
    }
  };

  // Payment CRUD
  const handlePaymentFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.userEmail || !paymentForm.txHash || !paymentForm.wallet) {
      alert('Please fill out user email, wallet address, and transaction hash.');
      return;
    }

    try {
      if (editingPayment) {
        // Edit existing payment
        const payRef = doc(db, 'payments', editingPayment.id);
        await updateDoc(payRef, {
          userEmail: paymentForm.userEmail,
          amount: Number(paymentForm.amount),
          wallet: paymentForm.wallet,
          network: paymentForm.network,
          txHash: paymentForm.txHash,
          paymentDate: paymentForm.paymentDate,
          status: paymentForm.status
        });
        setEditingPayment(null);
      } else {
        // Record new payment
        await addDoc(collection(db, 'payments'), {
          uid: paymentForm.uid || 'manual_uid',
          userEmail: paymentForm.userEmail,
          submissionId: paymentForm.submissionId || '',
          amount: Number(paymentForm.amount),
          wallet: paymentForm.wallet,
          network: paymentForm.network,
          txHash: paymentForm.txHash,
          paymentDate: paymentForm.paymentDate,
          status: paymentForm.status,
          createdAt: new Date().toISOString()
        });

        // Update associated submission paymentStatus if selected
        if (paymentForm.submissionId) {
          const subRef = doc(db, 'submissions', paymentForm.submissionId);
          await updateDoc(subRef, {
            paymentStatus: 'paid',
            lastUpdated: new Date().toISOString()
          });
        }
      }

      setShowPaymentModal(false);
      setPaymentForm({
        uid: '',
        userEmail: '',
        submissionId: '',
        amount: 10,
        wallet: '',
        network: 'USDT BEP-20',
        txHash: '',
        paymentDate: new Date().toISOString().split('T')[0],
        status: 'Paid'
      });
    } catch (err) {
      console.error('Error recording/updating payment:', err);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    try {
      await deleteDoc(doc(db, 'payments', id));
    } catch (err) {
      console.error('Error deleting payment:', err);
    }
  };

  // Assign Custom Bonus Reward
  const handleBonusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusForm.userEmail || !bonusForm.amount) {
      alert('Please fill out user email and bonus amount.');
      return;
    }
    const matchedUser = users.find(u => u.email.toLowerCase() === bonusForm.userEmail.toLowerCase());
    try {
      await addDoc(collection(db, 'submissions'), {
        uid: matchedUser?.uid || 'bonus_uid',
        userEmail: bonusForm.userEmail,
        userFullName: matchedUser?.fullName || 'Promoter',
        projectName: 'TripToCoin',
        tweetUrl: 'https://x.com/TripToCoin/status/bonus-reward',
        likes: 0,
        replies: 0,
        reposts: 0,
        bookmarks: 0,
        views: 0,
        status: 'approved',
        rewardAmount: Number(bonusForm.amount),
        paymentStatus: 'pending',
        note: `Bonus Reward: ${bonusForm.reason}`,
        createdAt: new Date().toISOString()
      });
      setShowBonusModal(false);
      alert(`Bonus reward of $${bonusForm.amount} assigned to ${bonusForm.userEmail}!`);
    } catch (err) {
      console.error('Error assigning bonus:', err);
    }
  };

  // CSV Exporter
  const exportSubmissionsCSV = () => {
    const headers = ['ID', 'User Email', 'Tweet URL', 'Status', 'Likes', 'Reposts', 'Views', 'Reward Amount', 'Payment Status', 'Created At'];
    const rows = submissions.map(s => [
      s.id,
      s.userEmail,
      `"${s.tweetUrl}"`,
      s.status,
      s.likes || 0,
      s.reposts || 0,
      s.views || 0,
      s.rewardAmount || 0,
      s.paymentStatus || 'unpaid',
      s.createdAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `triptocoin_submissions_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats Calculations
  const totalUsersCount = users.length;
  const totalSubmissionsCount = submissions.length;
  const pendingSubmissionsCount = submissions.filter(s => s.status === 'pending').length;
  const approvedSubmissionsCount = submissions.filter(s => s.status === 'approved').length;
  const totalApprovedRewards = submissions.filter(s => s.status === 'approved').reduce((s, x) => s + (x.rewardAmount || 0), 0);
  const totalPaidRewards = payments.filter(p => p.status === 'Paid').reduce((s, x) => s + (x.amount || 0), 0);

  // Filter Submissions
  const filteredSubmissions = submissions.filter(s => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesSearch = s.tweetUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filter Users
  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'all' || (u.role || 'user') === roleFilter;
    const matchesSearch = (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.walletBep20 || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.walletArb || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.twitter || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Dedicated Admin Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">TripToCoin Platform Control Panel</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Full control over Dashboard stats, User Profiles, Promotion Submissions, Rewards, Payments, and System Settings.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onExitAdmin && (
            <button
              onClick={onExitAdmin}
              className="inline-flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl text-xs border border-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Back to Web App</span>
            </button>
          )}

          <button
            onClick={exportSubmissionsCSV}
            className="inline-flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 text-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Menu (Direct Control for All 7 Options) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex flex-wrap gap-1.5 text-xs font-bold">
        {[
          { id: 'dashboard', label: 'Dashboard Control', icon: LayoutDashboard },
          { id: 'users', label: 'User Profiles', icon: Users, count: users.length },
          { id: 'submit', label: 'Submit Promotion', icon: Send },
          { id: 'history', label: 'Submission History', icon: FileText, count: submissions.length },
          { id: 'rewards', label: 'Rewards Config', icon: Award },
          { id: 'payments', label: 'Payments & Payouts', icon: CreditCard, count: payments.length },
          { id: 'settings', label: 'System Settings', icon: Settings }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeAdminTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveAdminTab(item.id as any)}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SEARCH BAR (For Users / Submissions / Payments) */}
      {(activeAdminTab === 'users' || activeAdminTab === 'history' || activeAdminTab === 'payments') && (
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={
                activeAdminTab === 'users'
                  ? 'Search user, email, twitter, or wallet...'
                  : activeAdminTab === 'payments'
                  ? 'Search email, wallet, txHash...'
                  : 'Search email or Tweet URL...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {activeAdminTab === 'history' && (
            <div className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto w-full sm:w-auto">
              <span className="text-slate-500 mr-1">Status:</span>
              {['all', 'pending', 'approved', 'rejected'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg capitalize text-xs ${
                    statusFilter === st ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}

          {activeAdminTab === 'users' && (
            <button
              onClick={() => setShowAddUserModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New User Profile</span>
            </button>
          )}

          {activeAdminTab === 'payments' && (
            <button
              onClick={() => {
                setEditingPayment(null);
                setPaymentForm({
                  uid: '',
                  userEmail: '',
                  submissionId: '',
                  amount: 10,
                  wallet: '',
                  network: 'USDT BEP-20',
                  txHash: '',
                  paymentDate: new Date().toISOString().split('T')[0],
                  status: 'Paid'
                });
                setShowPaymentModal(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record New Payment</span>
            </button>
          )}
        </div>
      )}

      {/* --- TAB 1: DASHBOARD CONTROL --- */}
      {activeAdminTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">Total Users</span>
              <span className="text-2xl font-extrabold text-slate-900">{totalUsersCount}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">Total Submissions</span>
              <span className="text-2xl font-extrabold text-blue-600">{totalSubmissionsCount}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">Pending Approval</span>
              <span className="text-2xl font-extrabold text-amber-600">{pendingSubmissionsCount}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">Approved Posts</span>
              <span className="text-2xl font-extrabold text-emerald-600">{approvedSubmissionsCount}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">Total Rewards Approved</span>
              <span className="text-2xl font-extrabold text-indigo-600">${totalApprovedRewards}</span>
            </div>
          </div>

          {/* Announcement Banner Editor */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-slate-900">
              <Megaphone className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold">Main Website Dashboard Announcement Banner</h2>
            </div>
            <p className="text-xs text-slate-500">
              This message appears at the top of all promoters' dashboards when they log into TripToCoin.
            </p>
            <textarea
              rows={3}
              value={settings.announcementBanner}
              onChange={(e) => setSettings({ ...settings, announcementBanner: e.target.value })}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Announcement text..."
            />
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs inline-flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? 'Saving Banner...' : 'Update Announcement Banner'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: USER PROFILES CONTROL --- */}
      {activeAdminTab === 'users' && (
        <div className="space-y-6">
          {/* Admin User Management Control Banner */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-lg text-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight">Admin Access & Role Management</h2>
                  <p className="text-xs text-slate-400">
                    Set new Gmail accounts as Administrator. Once set, they will have full Admin Panel access.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold rounded-full">
                  Total Admins: {users.filter(u => u.role === 'admin').length}
                </span>
                <span className="text-xs px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-full">
                  Promoters: {users.filter(u => u.role !== 'admin').length}
                </span>
              </div>
            </div>

            {adminMgmtMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{adminMgmtMsg}</span>
              </div>
            )}

            {/* Form to Grant Admin Privileges to Email */}
            <form onSubmit={handleSetAdminByEmail} className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:flex-1">
                <UserPlus className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="Enter Gmail address (e.g. newadmin@gmail.com)..."
                  value={newAdminEmailInput}
                  onChange={(e) => setNewAdminEmailInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
              >
                <Shield className="w-4 h-4" />
                <span>Set Admin Access</span>
              </button>
            </form>
          </div>

          {/* User Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
              <h2 className="font-bold text-sm text-slate-800">Registered Accounts ({filteredUsers.length})</h2>

              {/* Role Filter Buttons */}
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="text-slate-400 text-[11px] mr-1">Filter Role:</span>
                <button
                  type="button"
                  onClick={() => setRoleFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs ${roleFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'}`}
                >
                  All Accounts
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('admin')}
                  className={`px-3 py-1 rounded-lg text-xs ${roleFilter === 'admin' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'}`}
                >
                  Admins Only
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('user')}
                  className={`px-3 py-1 rounded-lg text-xs ${roleFilter === 'user' ? 'bg-slate-800 text-white font-bold' : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'}`}
                >
                  Promoters
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Account / Email</th>
                    <th className="px-5 py-3.5">System Role</th>
                    <th className="px-5 py-3.5">Social Contacts</th>
                    <th className="px-5 py-3.5">BEP-20 Wallet</th>
                    <th className="px-5 py-3.5">ARB Wallet</th>
                    <th className="px-5 py-3.5 text-right">Admin Role Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        No accounts match the current search or role filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isOwner = u.email?.toLowerCase() === 'shahinkhan28aa@gmail.com';
                      const isAdminAccount = u.role === 'admin';

                      return (
                        <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{u.fullName || 'Promoter'}</span>
                              {isOwner && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500 text-slate-950 border border-amber-400 shadow-xs">
                                  PRIMARY OWNER
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase inline-flex items-center gap-1 ${
                              isAdminAccount
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              <Shield className={`w-3 h-3 ${isAdminAccount ? 'text-amber-600' : 'text-slate-400'}`} />
                              <span>{u.role || 'user'}</span>
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-600 space-y-0.5 text-[11px]">
                            <div>TG: {u.telegram || '—'}</div>
                            <div>WA: {u.whatsapp || '—'}</div>
                            <div>X: {u.twitter || '—'}</div>
                          </td>
                          <td className="px-5 py-4 font-mono text-slate-700 max-w-[140px] truncate">
                            {u.walletBep20 || u.wallet || '—'}
                          </td>
                          <td className="px-5 py-4 font-mono text-slate-700 max-w-[140px] truncate">
                            {u.walletArb || '—'}
                          </td>
                          <td className="px-5 py-4 text-right space-x-1.5">
                            {/* Role Toggle Button */}
                            {isOwner ? (
                              <span className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 rounded-lg border border-amber-200 inline-flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                Owner Admin
                              </span>
                            ) : isAdminAccount ? (
                              <button
                                type="button"
                                onClick={() => handleToggleAdminRole(u, 'user')}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold text-[11px] border border-rose-200 inline-flex items-center gap-1 transition-colors"
                                title="Revoke Admin Access"
                              >
                                <UserMinus className="w-3.5 h-3.5 text-rose-600" />
                                Remove Admin
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleAdminRole(u, 'admin')}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-[11px] border border-amber-200 inline-flex items-center gap-1 transition-colors"
                                title="Grant Admin Access"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                Set Admin
                              </button>
                            )}

                            {/* Edit Button */}
                            <button
                              onClick={() => setEditingUser(u)}
                              className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold text-[11px]"
                              title="Edit Profile"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button (disabled for owner) */}
                            {!isOwner && (
                              <button
                                onClick={() => handleDeleteUser(u.uid)}
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-bold text-[11px]"
                                title="Delete Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: SUBMIT PROMOTION CONTROL --- */}
      {activeAdminTab === 'submit' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Submit Promotion On Behalf of Promoter</h2>
              <p className="text-xs text-slate-500">Manually insert a promotional X/Twitter submission directly into Firestore.</p>
            </div>
          </div>

          <form onSubmit={handleManualSubSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Promoter Email *</label>
              <select
                required
                value={manualSub.userEmail}
                onChange={(e) => setManualSub({ ...manualSub, userEmail: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="">-- Select Promoter --</option>
                {users.map(u => (
                  <option key={u.uid} value={u.email}>{u.fullName || 'Promoter'} ({u.email})</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block font-semibold text-slate-700">Tweet / X Post URL *</label>
                <button
                  type="button"
                  onClick={handleSyncEngagement}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Auto-Sync Engagement</span>
                </button>
              </div>
              <input
                type="url"
                required
                placeholder="https://x.com/username/status/123456789"
                value={manualSub.tweetUrl}
                onChange={(e) => setManualSub({ ...manualSub, tweetUrl: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Click "Auto-Sync Engagement" to automatically detect post views, likes, reposts, and calculate dollar rewards.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">Views</label>
                <input
                  type="number"
                  value={manualSub.views}
                  onChange={(e) => setManualSub({ ...manualSub, views: Number(e.target.value) })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Likes</label>
                <input
                  type="number"
                  value={manualSub.likes}
                  onChange={(e) => setManualSub({ ...manualSub, likes: Number(e.target.value) })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Reposts</label>
                <input
                  type="number"
                  value={manualSub.reposts}
                  onChange={(e) => setManualSub({ ...manualSub, reposts: Number(e.target.value) })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Reward ($ USD)</label>
                <input
                  type="number"
                  value={manualSub.rewardAmount}
                  onChange={(e) => setManualSub({ ...manualSub, rewardAmount: Number(e.target.value) })}
                  className="w-full p-2.5 border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Initial Status</label>
                <select
                  value={manualSub.status}
                  onChange={(e) => setManualSub({ ...manualSub, status: e.target.value as any })}
                  className="w-full p-2.5 border rounded-xl font-medium"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Notes / Internal Tag</label>
              <input
                type="text"
                value={manualSub.note}
                onChange={(e) => setManualSub({ ...manualSub, note: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-600/20"
            >
              Submit Promotion Record
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 4: SUBMISSION HISTORY CONTROL --- */}
      {activeAdminTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">User Email</th>
                  <th className="px-5 py-3.5">Tweet URL</th>
                  <th className="px-5 py-3.5">Engagement</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Reward</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      <div>{sub.userFullName || 'Promoter'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{sub.userEmail}</div>
                    </td>

                    <td className="px-5 py-4">
                      <a
                        href={sub.tweetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                      >
                        <span className="truncate">{sub.tweetUrl}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2 text-[11px] text-slate-600">
                        <span>👍 {sub.likes || 0}</span>
                        <span>🔄 {sub.reposts || 0}</span>
                        <span>👁️ {sub.views || 0}</span>
                        <button
                          onClick={() => {
                            setEngagementSub(sub);
                            setEngagementData({
                              likes: sub.likes || 0,
                              replies: sub.replies || 0,
                              reposts: sub.reposts || 0,
                              bookmarks: sub.bookmarks || 0,
                              views: sub.views || 0
                            });
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Engagement Stats"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        sub.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        sub.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {sub.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-bold text-slate-800">
                      ${sub.rewardAmount || 0}
                    </td>

                    <td className="px-5 py-4 text-right space-x-1.5">
                      <button
                        onClick={() => {
                          setEditingSub(sub);
                          setRewardInput(sub.rewardAmount || 10);
                          setRejectionReasonInput('');
                        }}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg text-[11px]"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => setDetailEditingSub(sub)}
                        className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-[11px]"
                        title="Edit Submission"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubmission(sub.id)}
                        className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[11px]"
                        title="Delete Submission"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 5: REWARDS CONFIG --- */}
      {activeAdminTab === 'rewards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rate Settings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Global Reward Rate Multipliers</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Rate per 1 View ($ USD)</label>
                <input
                   type="number"
                   step="0.0001"
                   value={settings.rewardPerView ?? 0}
                   onChange={(e) => setSettings({ ...settings, rewardPerView: Number(e.target.value) })}
                   className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Rate per 1 Like ($ USD)</label>
                <input
                   type="number"
                   step="0.001"
                   value={settings.rewardPerLike ?? 0}
                   onChange={(e) => setSettings({ ...settings, rewardPerLike: Number(e.target.value) })}
                   className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Rate per 1 Repost ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.rewardPerRepost ?? 0}
                  onChange={(e) => setSettings({ ...settings, rewardPerRepost: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Minimum Payout Limit ($ USD)</label>
                <input
                  type="number"
                  value={settings.minPayoutUsd ?? 0}
                  onChange={(e) => setSettings({ ...settings, minPayoutUsd: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs"
            >
              {savingSettings ? 'Saving...' : 'Save Reward Rate Settings'}
            </button>
          </div>

          {/* Banner Promo Targets */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span>Landing Page Promo Banners</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Set the targets shown on the home page banners. These values will be multiplied by the current rates to show potential earnings.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Banner View Target</label>
                <input
                  type="number"
                  value={settings.heroBannerViews ?? 100000}
                  onChange={(e) => setSettings({ ...settings, heroBannerViews: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                  placeholder="e.g. 100000"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Banner Like Target</label>
                <input
                  type="number"
                  value={settings.heroBannerLikes ?? 100000}
                  onChange={(e) => setSettings({ ...settings, heroBannerLikes: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                  placeholder="e.g. 100000"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Banner Repost Target</label>
                <input
                  type="number"
                  value={settings.heroBannerReposts ?? 100000}
                  onChange={(e) => setSettings({ ...settings, heroBannerReposts: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                  placeholder="e.g. 100000"
                />
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
            >
              {savingSettings ? 'Saving...' : 'Save Banner Targets'}
            </button>
          </div>

          {/* Assign Bonus Modal Button Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                <span>Assign Custom Bonus Reward</span>
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                Instantly grant a top promoter or participant a custom reward bonus that will show in their account total earnings.
              </p>
            </div>

            <button
              onClick={() => setShowBonusModal(true)}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20"
            >
              + Assign Bonus Reward
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 6: PAYMENTS & PAYOUT LOGS --- */}
      {activeAdminTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">User Email</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Network</th>
                  <th className="px-5 py-3.5">Wallet Address</th>
                  <th className="px-5 py-3.5">Tx Hash</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors font-medium">
                    <td className="px-5 py-4 font-mono text-slate-800">{p.userEmail}</td>
                    <td className="px-5 py-4 font-extrabold text-slate-900">${p.amount} USD</td>
                    <td className="px-5 py-4 font-bold text-blue-600">
                      {p.network || 'USDT BEP-20'}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600 max-w-[140px] truncate">{p.wallet}</td>
                    <td className="px-5 py-4 font-mono text-blue-600 truncate max-w-[140px]">{p.txHash}</td>
                    <td className="px-5 py-4 text-slate-500">{p.paymentDate}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-1.5">
                      <button
                        onClick={() => {
                          setEditingPayment(p);
                          setPaymentForm({
                            uid: p.uid,
                            userEmail: p.userEmail,
                            submissionId: p.submissionId || '',
                            amount: p.amount,
                            wallet: p.wallet,
                            network: (p.network as any) || 'USDT BEP-20',
                            txHash: p.txHash,
                            paymentDate: p.paymentDate,
                            status: p.status
                          });
                          setShowPaymentModal(true);
                        }}
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[11px]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(p.id)}
                        className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[11px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 7: SYSTEM SETTINGS --- */}
      {activeAdminTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Platform Global Configurations</h2>
            <p className="text-xs text-slate-500">Configure logo branding, contract addresses, maintenance mode, and official handles.</p>
          </div>

          {settingsMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              {settingsMsg}
            </div>
          )}

          <div className="space-y-4 text-xs">
            {/* Website Logo Field */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="block font-bold text-slate-900">
                Website Brand Logo
              </label>
              <p className="text-[11px] text-slate-500">
                Upload or specify an image URL for the TripToCoin website logo displayed on headers and sidebars.
              </p>

              {/* Logo Preview */}
              <div className="flex items-center space-x-3 p-3 bg-slate-900 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-emerald-500 to-amber-500 flex items-center justify-center overflow-hidden">
                  {settings.siteLogoUrl ? (
                    <img src={settings.siteLogoUrl} alt="Website Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Coins className="w-6 h-6 text-white" />
                  )}
                </div>
                <span className="font-bold text-lg text-white">
                  TripTo<span className="text-emerald-400">Coin</span>
                </span>
              </div>

              <input
                type="text"
                value={settings.siteLogoUrl || ''}
                onChange={(e) => setSettings({ ...settings, siteLogoUrl: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-900 text-xs"
                placeholder="https://example.com/logo.png"
              />

              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 font-semibold cursor-pointer text-xs">
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>Upload Logo File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAdminLogoFileUpload}
                    className="hidden"
                  />
                </label>
                {settings.siteLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, siteLogoUrl: '' })}
                    className="text-rose-600 hover:underline text-[11px] font-semibold"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>

              <div>
                <label className="block font-semibold mb-1">Official Twitter / X Account URL *</label>
                <input
                  type="text"
                  value={settings.officialTwitterAccount || ''}
                  onChange={(e) => setSettings({ ...settings, officialTwitterAccount: e.target.value })}
                  className="w-full p-2.5 border border-blue-200 bg-blue-50/20 rounded-xl font-mono text-slate-900 font-bold"
                  placeholder="https://x.com/TripToCoin"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Main platform Twitter account used for verifying promotional tweet mentions.
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1">USDT BEP-20 Token Contract Address</label>
                <input
                  type="text"
                  value={settings.usdtBep20Contract || ''}
                  onChange={(e) => setSettings({ ...settings, usdtBep20Contract: e.target.value })}
                  className="w-full p-2.5 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">USDT ARB Token Contract Address</label>
                <input
                  type="text"
                  value={settings.usdtArbContract || ''}
                  onChange={(e) => setSettings({ ...settings, usdtArbContract: e.target.value })}
                  className="w-full p-2.5 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Telegram Support Handle</label>
                <input
                  type="text"
                  value={settings.supportTelegram || ''}
                  onChange={(e) => setSettings({ ...settings, supportTelegram: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Maintenance Mode</span>
                  <span className="text-[11px] text-slate-500">Temporarily pause new submissions for system upgrades</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode || false}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-5 h-5 accent-blue-600 rounded"
                />
              </div>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-600/20"
            >
              {savingSettings ? 'Saving Configuration...' : 'Save System Settings'}
            </button>
          </div>
        </div>
      )}

      {/* --- ALL MODALS --- */}

      {/* MODAL 1: EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900">Edit User Profile</h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingUser.fullName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Role</label>
                  <select
                    value={editingUser.role || 'user'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full p-2.5 border rounded-xl font-bold"
                  >
                    <option value="user">User / Promoter</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Telegram</label>
                  <input
                    type="text"
                    value={editingUser.telegram || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, telegram: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={editingUser.whatsapp || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, whatsapp: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Twitter / X</label>
                  <input
                    type="text"
                    value={editingUser.twitter || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, twitter: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-emerald-700 mb-1">usdt BEP-20 Wallet Address</label>
                <input
                  type="text"
                  value={editingUser.walletBep20 || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, walletBep20: e.target.value })}
                  placeholder="0x..."
                  className="w-full p-2.5 border border-emerald-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-blue-700 mb-1">usdt arb Wallet Address</label>
                <input
                  type="text"
                  value={editingUser.walletArb || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, walletArb: e.target.value })}
                  placeholder="0x..."
                  className="w-full p-2.5 border border-blue-200 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUserEdit}
                className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
              >
                Save User Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddUserSubmit} className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900">Add New User Profile</h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full p-2.5 border rounded-xl font-bold"
                  >
                    <option value="user">User / Promoter</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">usdt BEP-20 Address</label>
                  <input
                    type="text"
                    value={newUser.walletBep20 || ''}
                    onChange={(e) => setNewUser({ ...newUser, walletBep20: e.target.value })}
                    placeholder="0x..."
                    className="w-full p-2.5 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">usdt arb Address</label>
                  <input
                    type="text"
                    value={newUser.walletArb || ''}
                    onChange={(e) => setNewUser({ ...newUser, walletArb: e.target.value })}
                    placeholder="0x..."
                    className="w-full p-2.5 border rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
              >
                Create User Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: REVIEW / DECIDE SUBMISSION */}
      {editingSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 border border-slate-200 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900">Review Promotion Submission</h3>
            
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-semibold text-slate-800">Promoter: {editingSub.userFullName} ({editingSub.userEmail})</p>
              <a href={editingSub.tweetUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-mono truncate block">
                {editingSub.tweetUrl}
              </a>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reward Amount ($ USD)
              </label>
              <input
                type="number"
                value={rewardInput}
                onChange={(e) => setRewardInput(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rejection Reason (if rejecting)
              </label>
              <input
                type="text"
                placeholder="Reason..."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingSub(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(editingSub)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl"
              >
                Reject Post
              </button>
              <button
                onClick={() => handleApprove(editingSub)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Approve & Assign Reward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT SUBMISSION DETAILS */}
      {detailEditingSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl text-xs">
            <h3 className="font-bold text-lg text-slate-900">Edit Submission Details</h3>

            <div>
              <label className="block font-semibold mb-1">Tweet / X Post URL</label>
              <input
                type="text"
                value={detailEditingSub.tweetUrl}
                onChange={(e) => setDetailEditingSub({ ...detailEditingSub, tweetUrl: e.target.value })}
                className="w-full p-2.5 border rounded-xl font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Status</label>
                <select
                  value={detailEditingSub.status}
                  onChange={(e) => setDetailEditingSub({ ...detailEditingSub, status: e.target.value as any })}
                  className="w-full p-2.5 border rounded-xl font-bold"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Reward ($ USD)</label>
                <input
                  type="number"
                  value={detailEditingSub.rewardAmount}
                  onChange={(e) => setDetailEditingSub({ ...detailEditingSub, rewardAmount: Number(e.target.value) })}
                  className="w-full p-2.5 border rounded-xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Payment Status</label>
              <select
                value={detailEditingSub.paymentStatus}
                onChange={(e) => setDetailEditingSub({ ...detailEditingSub, paymentStatus: e.target.value as any })}
                className="w-full p-2.5 border rounded-xl"
              >
                <option value="unpaid">unpaid</option>
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="failed">failed</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDetailEditingSub(null)}
                className="px-4 py-2 bg-slate-100 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDetailSubEdit}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT ENGAGEMENT */}
      {engagementSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-lg text-slate-900">Update Engagement Metrics</h3>
              <button
                type="button"
                onClick={handleSyncEngagementModal}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-amber-300" />
                <span>Sync Live Twitter Data</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Likes</label>
                <input
                  type="number"
                  value={engagementData.likes}
                  onChange={(e) => setEngagementData({ ...engagementData, likes: Number(e.target.value) })}
                  className="w-full p-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Replies</label>
                <input
                  type="number"
                  value={engagementData.replies}
                  onChange={(e) => setEngagementData({ ...engagementData, replies: Number(e.target.value) })}
                  className="w-full p-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Reposts</label>
                <input
                  type="number"
                  value={engagementData.reposts}
                  onChange={(e) => setEngagementData({ ...engagementData, reposts: Number(e.target.value) })}
                  className="w-full p-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Bookmarks</label>
                <input
                  type="number"
                  value={engagementData.bookmarks}
                  onChange={(e) => setEngagementData({ ...engagementData, bookmarks: Number(e.target.value) })}
                  className="w-full p-2 border rounded-xl"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold mb-1">Views</label>
                <input
                  type="number"
                  value={engagementData.views}
                  onChange={(e) => setEngagementData({ ...engagementData, views: Number(e.target.value) })}
                  className="w-full p-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEngagementSub(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEngagement}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
              >
                Save Engagement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: RECORD / EDIT PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handlePaymentFormSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900">
              {editingPayment ? 'Edit Payment Record' : 'Record Reward Payment'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select User Email *</label>
                <select
                  required
                  value={paymentForm.userEmail}
                  onChange={(e) => {
                    const selectedUser = users.find(u => u.email === e.target.value);
                    const defaultWallet =
                      paymentForm.network === 'USDT ARB'
                        ? selectedUser?.walletArb || selectedUser?.wallet || ''
                        : selectedUser?.walletBep20 || selectedUser?.wallet || '';
                    setPaymentForm({
                      ...paymentForm,
                      uid: selectedUser?.uid || '',
                      userEmail: e.target.value,
                      wallet: defaultWallet
                    });
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 font-medium"
                >
                  <option value="">-- Select User --</option>
                  {users.map(u => (
                    <option key={u.uid} value={u.email}>{u.fullName || 'Promoter'} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Payment Network *</label>
                  <select
                    value={paymentForm.network}
                    onChange={(e) => {
                      const net = e.target.value as any;
                      const selectedUser = users.find(u => u.email === paymentForm.userEmail);
                      const netWallet =
                        net === 'USDT ARB'
                          ? selectedUser?.walletArb || selectedUser?.wallet || ''
                          : selectedUser?.walletBep20 || selectedUser?.wallet || '';
                      setPaymentForm({
                        ...paymentForm,
                        network: net,
                        wallet: netWallet || paymentForm.wallet
                      });
                    }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="USDT BEP-20">usdt BEP-20</option>
                    <option value="USDT ARB">usdt arb</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Amount ($ USD) *</label>
                  <input
                    type="number"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Payout Wallet Address *</label>
                <input
                  type="text"
                  required
                  value={paymentForm.wallet}
                  onChange={(e) => setPaymentForm({ ...paymentForm, wallet: e.target.value })}
                  placeholder="0x..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  <select
                    value={paymentForm.status}
                    onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value as any })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Processing">Processing</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Transaction Hash (TxHash) *</label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={paymentForm.txHash}
                  onChange={(e) => setPaymentForm({ ...paymentForm, txHash: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
              >
                Save Payment Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 7: CUSTOM BONUS MODAL */}
      {showBonusModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleBonusSubmit} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl text-xs">
            <h3 className="font-bold text-lg text-slate-900">Assign Custom Bonus Reward</h3>

            <div>
              <label className="block font-semibold mb-1">Promoter Email *</label>
              <select
                required
                value={bonusForm.userEmail}
                onChange={(e) => setBonusForm({ ...bonusForm, userEmail: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              >
                <option value="">-- Select Promoter --</option>
                {users.map(u => (
                  <option key={u.uid} value={u.email}>{u.fullName || 'Promoter'} ({u.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Bonus Amount ($ USD) *</label>
              <input
                type="number"
                required
                value={bonusForm.amount}
                onChange={(e) => setBonusForm({ ...bonusForm, amount: Number(e.target.value) })}
                className="w-full p-2.5 border rounded-xl font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Bonus Reason / Note *</label>
              <input
                type="text"
                required
                value={bonusForm.reason}
                onChange={(e) => setBonusForm({ ...bonusForm, reason: e.target.value })}
                className="w-full p-2.5 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBonusModal(false)}
                className="px-4 py-2 bg-slate-100 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl"
              >
                Grant Bonus Reward
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
