import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider, signInWithPopup, firebaseSignOut } from '../lib/firebase';
import { UserProfile, UserRole, SystemSettings } from '../types';
import { compressImageToDataUrl } from '../lib/imageUtils';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  settings: SystemSettings;
  signInWithGoogle: () => Promise<void>;
  demoSignIn: (asAdmin?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  setDemoAdmin: (val: boolean) => void;
  updateSystemSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
}

const defaultSettings: SystemSettings = {
  siteLogoUrl: '',
  minPayoutUsd: 10,
  rewardPerThousandViews: 2.0,
  rewardPerThousandLikes: 5.0,
  rewardPerRepost: 0.5,
  usdtBep20Contract: '0x55d398326f99059fF775485246999027B3197955',
  usdtArbContract: '0xFd086bC7cd5C481DCC9C85ebE478A1C0b69FCbb9',
  maintenanceMode: false,
  announcementBanner: 'Welcome to TripToCoin Rewards! Earn USDT for promoting our token on X.',
  supportTelegram: '@triptocoin_support',
  officialTwitterAccount: 'https://x.com/TripToCoin'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [overrideAdmin, setOverrideAdmin] = useState<boolean>(false);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);

  // Global Settings Real-Time Sync
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'global');
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        setSettings(prev => ({ ...prev, ...(snap.data() as SystemSettings) }));
      }
    }, (err) => {
      console.warn('Settings snapshot listener error:', err);
    });
    return () => unsubSettings();
  }, []);

  // Fetch or initialize user profile in Firestore
  const fetchOrCreateProfile = async (firebaseUser: User) => {
    try {
      const isDefaultAdmin = firebaseUser.email?.toLowerCase() === 'shahinkhan28aa@gmail.com';
      const userRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        // If it's the primary admin email, ensure role is 'admin'
        if (isDefaultAdmin && data.role !== 'admin') {
          data.role = 'admin';
          await updateDoc(userRef, { role: 'admin' });
        }
        setUserProfile(data);
      } else {
        // First login: check if an admin pre-granted admin rights by email
        let grantedRole: UserRole = isDefaultAdmin ? 'admin' : 'user';
        if (!isDefaultAdmin && firebaseUser.email) {
          try {
            const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email), where('role', '==', 'admin'));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              grantedRole = 'admin';
            }
          } catch (e) {
            console.warn('Error checking pre-granted admin role:', e);
          }
        }

        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          fullName: firebaseUser.displayName || 'TripToCoin Promoter',
          email: firebaseUser.email || '',
          telegram: '',
          whatsapp: '',
          twitter: '',
          wallet: '',
          walletBep20: '',
          walletArb: '',
          country: '',
          role: grantedRole,
          createdAt: new Date().toISOString()
        };

        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.error('Error fetching/creating user profile:', err);
      // Fallback local state if network or permission fails
      setUserProfile({
        uid: firebaseUser.uid,
        fullName: firebaseUser.displayName || 'TripToCoin Promoter',
        email: firebaseUser.email || '',
        telegram: '',
        whatsapp: '',
        twitter: '',
        wallet: '',
        walletBep20: '',
        walletArb: '',
        country: '',
        role: firebaseUser.email?.toLowerCase() === 'shahinkhan28aa@gmail.com' ? 'admin' : 'user',
        createdAt: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchOrCreateProfile(firebaseUser);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await fetchOrCreateProfile(result.user);
      }
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        alert('Google popup window was closed or blocked by iframe. Signing in with demo account so you can continue!');
        await demoSignIn(false);
      } else {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const demoSignIn = async (asAdmin: boolean = false) => {
    setLoading(true);
    const demoUid = asAdmin ? 'demo_admin_uid_123' : 'demo_user_uid_456';
    const demoEmail = asAdmin ? 'shahinkhan28aa@gmail.com' : 'promoter@triptocoin.com';
    const demoName = asAdmin ? 'TripToCoin Admin (Shahin Khan)' : 'Alex Rivera';

    const fakeUser = {
      uid: demoUid,
      email: demoEmail,
      displayName: demoName,
      emailVerified: true
    } as unknown as User;

    setUser(fakeUser);

    const demoProfile: UserProfile = {
      uid: demoUid,
      fullName: demoName,
      email: demoEmail,
      telegram: asAdmin ? '@triptocoin_admin' : '@alex_promoter',
      whatsapp: '+1 555-0199',
      twitter: asAdmin ? '@triptocoin_official' : '@alex_crypto_posts',
      wallet: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      walletBep20: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      walletArb: '0xB4C7656EC7ab88b098defB751B7401B5f6d8976E',
      country: 'United States',
      role: asAdmin ? 'admin' : 'user',
      createdAt: new Date().toISOString()
    };

    try {
      const userRef = doc(db, 'users', demoUid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else {
        await setDoc(userRef, demoProfile);
        setUserProfile(demoProfile);
      }
    } catch (e) {
      setUserProfile(demoProfile);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Logout error', e);
    }
    setUser(null);
    setUserProfile(null);
    setLoading(false);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user || !userProfile) return;
    const updated = { ...userProfile, ...data };
    setUserProfile(updated);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, data);
    } catch (err) {
      console.error('Error updating profile in Firestore:', err);
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, updated, { merge: true });
      } catch (e2) {
        console.error('Fallback setDoc error:', e2);
      }
    }
  };

  const updateSystemSettings = async (newSettings: Partial<SystemSettings>) => {
    let settingsToSave = { ...settings, ...newSettings };
    if (settingsToSave.siteLogoUrl && settingsToSave.siteLogoUrl.startsWith('data:image/') && settingsToSave.siteLogoUrl.length > 100000) {
      try {
        settingsToSave.siteLogoUrl = await compressImageToDataUrl(settingsToSave.siteLogoUrl, 160, 0.85);
      } catch (e) {
        console.warn('Could not compress logo URL:', e);
      }
    }
    setSettings(settingsToSave);
    try {
      const settingsRef = doc(db, 'settings', 'global');
      await setDoc(settingsRef, settingsToSave, { merge: true });
    } catch (err) {
      console.error('Error saving global system settings:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchOrCreateProfile(user);
    }
  };

  const isAdmin = overrideAdmin || userProfile?.role === 'admin' || user?.email?.toLowerCase() === 'shahinkhan28aa@gmail.com';

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        settings,
        signInWithGoogle,
        demoSignIn,
        logout,
        updateProfileData,
        refreshProfile,
        setDemoAdmin: setOverrideAdmin,
        updateSystemSettings
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
