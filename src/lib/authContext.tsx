import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string, phone?: string, city?: string) => Promise<void>;
  loginWithPhoneWhatsApp: (phone: string, name: string, city?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LOCAL_USER_KEY = 'cars_libya_auth_profile';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile(data);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(data));
          } else {
            const newProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم المنصة',
              email: user.email || undefined,
              phone: user.phoneNumber || undefined,
              city: 'طرابلس',
              createdAt: Date.now()
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newProfile));
          }
        } catch {
          const fallbackProfile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || 'مستخدم',
            email: user.email || undefined,
            createdAt: Date.now()
          };
          setUserProfile(fallbackProfile);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const profile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || 'مستخدم',
      email: user.email || undefined,
      createdAt: Date.now()
    };
    setUserProfile(profile);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
  };

  const loginWithPhoneWhatsApp = async (phone: string, name: string, city?: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const profile: UserProfile = {
      uid: 'phone_' + cleanPhone,
      displayName: name.trim() || `مستخدم (${cleanPhone.slice(-4)})`,
      phone: cleanPhone,
      city: city || 'طرابلس',
      createdAt: Date.now()
    };
    setUserProfile(profile);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
  };

  const logout = async () => {
    try { await signOut(auth); } catch {}
    setUserProfile(null);
    localStorage.removeItem(LOCAL_USER_KEY);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      loginWithGoogle,
      loginWithEmail: async () => {},
      signupWithEmail: async () => {},
      loginWithPhoneWhatsApp,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
