'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Firestore } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Monitor auth state
  useEffect(() => {
    // Guard: if Firebase isn't configured, skip listener to avoid runtime errors
    if (!auth) {
      console.warn('⚠️ Firebase auth is not initialized. Check .env.local and restart dev server.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          // Fetch user profile from Firestore
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Chyba při načítání profilu');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Register user
  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setError(null);
        
        // Check if Firebase is configured
        if (!auth) {
          const errorMessage = '⚠️ Firebase není nakonfigurován. Aktivujte Email/Password autentifikaci ve Firebase Console.';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }
        
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = result.user;

        // Save user profile to Firestore
        const userProfile: UserProfile = {
          uid: newUser.uid,
          email: newUser.email || '',
          name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const userDocRef = doc(db, 'users', newUser.uid);
        await setDoc(userDocRef, userProfile);

        setUser(newUser);
        setUserProfile(userProfile);
        return { success: true, user: newUser };
      } catch (err: unknown) {
        // Log full error for debugging
        const error = err as { code?: string; message?: string };
        console.error('Firebase register error:', {
          code: error?.code,
          message: error?.message,
        });
        const errorMessage = getErrorMessage(err?.code);
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Login user
  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      
      // Check if Firebase is configured
      if (!auth) {
        const errorMessage = '⚠️ Firebase není nakonfigurován. Aktivujte Email/Password autentifikaci ve Firebase Console.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = result.user;

      // Fetch user profile
      const userDocRef = doc(db, 'users', loggedInUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      }

      setUser(loggedInUser);
      return { success: true, user: loggedInUser };
    } catch (err: unknown) {
      // Log full error for debugging
      const error = err as { code?: string; message?: string };
      console.error('Firebase login error:', {
        code: error?.code,
        message: error?.message,
      });
      const errorMessage = getErrorMessage(err?.code);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      return { success: true };
    } catch (err: unknown) {
      const error = err as { code?: string };
      const errorMessage = getErrorMessage(error.code || '');
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    user,
    userProfile,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };
};

// Helper function to convert Firebase error codes to Czech messages
function getErrorMessage(errorCode: string): string {
  const errorMessages: { [key: string]: string } = {
    'auth/email-already-in-use': 'Tento email již existuje',
    'auth/invalid-email': 'Neplatný email',
    'auth/missing-email': 'Chybí email',
    'auth/missing-password': 'Chybí heslo',
    'auth/weak-password': 'Heslo je příliš slabé (minimálně 6 znaků)',
    'auth/user-not-found': 'Uživatel nenalezen',
    'auth/wrong-password': 'Nesprávné heslo',
    'auth/invalid-credential': 'Nesprávné údaje pro přihlášení',
    'auth/operation-not-allowed': 'Operace není povolena (povolte Email/Password ve Firebase)',
    'auth/too-many-requests': 'Příliš mnoho pokusů. Zkuste to později',
    'auth/network-request-failed': 'Síťová chyba. Zkontrolujte připojení k internetu',
    'auth/invalid-api-key': 'Neplatný API klíč Firebase. Zkontrolujte .env.local',
    'auth/internal-error': 'Interní chyba služby. Zkuste to později',
  };

  if (!errorCode) {
    return 'Došlo k chybě. Zkuste to později.';
  }

  return errorMessages[errorCode] || `Došlo k chybě (${errorCode}). Zkontrolujte konfiguraci Firebase.`;
}
