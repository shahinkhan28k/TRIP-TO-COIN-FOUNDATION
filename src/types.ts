export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  telegram: string;
  whatsapp: string;
  twitter: string;
  wallet?: string; // Legacy fallback
  walletBep20: string; // usdt BEP-20 address
  walletArb: string;   // usdt ARB address
  country: string;
  role: UserRole;
  createdAt: string;
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed';

export interface Submission {
  id: string;
  uid: string;
  projectName: string; // Always "TripToCoin"
  tweetUrl: string;
  likes: number;
  replies: number;
  reposts: number;
  bookmarks: number;
  views: number;
  status: SubmissionStatus;
  rewardAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  note?: string;
  userEmail: string;
  userFullName?: string;
  rejectionReason?: string;
  lastUpdated?: string;
  aiVerified?: boolean;
}

export interface PaymentRecord {
  id: string;
  uid: string;
  submissionId?: string;
  amount: number;
  wallet: string;
  network?: 'USDT BEP-20' | 'USDT ARB' | string;
  txHash: string;
  paymentDate: string;
  status: 'Paid' | 'Processing' | 'Failed';
  createdAt: string;
  userEmail: string;
  requestType?: 'withdrawal' | 'admin_payout';
}

export interface SystemSettings {
  siteLogoUrl?: string; // Custom logo image URL
  minPayoutUsd: number;
  rewardPerView: number;
  rewardPerLike: number;
  rewardPerRepost: number;
  usdtBep20Contract: string;
  usdtArbContract: string;
  maintenanceMode: boolean;
  announcementBanner: string;
  supportTelegram: string;
  officialTwitterAccount?: string; // e.g. "https://x.com/TripToCoin" or "@TripToCoin"
}

export type NavigationTab = 
  | 'dashboard' 
  | 'profile' 
  | 'submit' 
  | 'history' 
  | 'rewards' 
  | 'payments' 
  | 'admin' 
  | 'settings';
