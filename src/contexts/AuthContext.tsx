import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  type User,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDB, isFirebaseConfigured } from '../firebase/config';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  firebaseReady: boolean;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_KEY = 'gastos-app-demo-user';

function getDemoUser(): User | null {
  try {
    const data = localStorage.getItem(DEMO_KEY);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

function saveDemoUser() {
  localStorage.setItem(DEMO_KEY, JSON.stringify({
    uid: 'demo-user',
    email: 'demo@gastosapp.cl',
    displayName: 'Usuario Demo',
    isDemo: true,
  }));
}

function clearDemoUser() {
  localStorage.removeItem(DEMO_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    if (!firebaseReady) {
      const demoUser = getDemoUser();
      if (demoUser) { setUser(demoUser as any); setIsDemo(true); }
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { setUser(user); setIsDemo(false); }
      else {
        const demoUser = getDemoUser();
        if (demoUser) { setUser(demoUser as any); setIsDemo(true); }
        else { setUser(null); setIsDemo(false); }
      }
      setLoading(false);
    });
    return unsub;
  }, [firebaseReady]);

  const login = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    await setPersistence(auth, browserLocalPersistence);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string) => {
    const auth = getFirebaseAuth();
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    try {
      const db = getFirestoreDB();
      await setDoc(doc(db, 'users', result.user.uid), { name, email, createdAt: new Date().toISOString() });
    } catch { /* Firestore optional */ }
  };

  const logout = async () => {
    if (isDemo) { clearDemoUser(); setUser(null); setIsDemo(false); return; }
    const auth = getFirebaseAuth();
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  };

  const loginWithGoogle = async () => {
    const auth = getFirebaseAuth();
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const loginAsDemo = async () => {
    if (firebaseReady) { try { await signOut(getFirebaseAuth()); } catch {} }
    saveDemoUser();
    setIsDemo(true);
    setUser(getDemoUser() as any);
  };

  return (
    <AuthContext.Provider value={{ user, loading, firebaseReady, isDemo, login, register, logout, resetPassword, loginWithGoogle, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
