import React, { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleAuthProvider, isFirebaseConfigured } from '../lib/firebase';
import { AuthContext } from './authContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => Boolean(auth && isFirebaseConfigured));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        console.warn('Auth state subscription error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth || !isFirebaseConfigured) {
      setError('Firebase Authentication is not configured. Check environment variables.');
      return;
    }

    setError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      if (authErr.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (authErr.code === 'auth/popup-blocked') {
        setError('Google Sign-In popup was blocked by your browser. Please allow popups for this site.');
        return;
      }
      if (authErr.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled in Firebase Console. Please enable it in Authentication -> Sign-in method.');
        return;
      }
      console.warn('Google sign-in failed:', err);
      setError(authErr.message || 'Failed to sign in with Google');
    }
  }, []);

  const logout = useCallback(async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setUser(null);
    } catch (err: unknown) {
      console.warn('Sign-out error:', err);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isConfigured: isFirebaseConfigured,
        signInWithGoogle,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
