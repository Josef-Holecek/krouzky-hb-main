'use client';

import { useState, useCallback } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ClaimRequest {
  id: string;
  clubId: string;
  clubName: string;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
}

export const useClaims = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitClaim = useCallback(
    async (claimData: Omit<ClaimRequest, 'id' | 'createdAt' | 'status' | 'resolvedAt' | 'resolvedBy'>) => {
      try {
        setError(null);
        if (!db) throw new Error('Firebase není nakonfigurován');

        // Debug: log auth state and claim data
        console.log('🔍 Submitting claim:', {
          userId: claimData.userId,
          clubId: claimData.clubId,
          userName: claimData.userName,
        });

        // Check if user already has a pending claim for this club
        const claimsRef = collection(db, 'claimRequests');
        const existing = query(
          claimsRef,
          where('clubId', '==', claimData.clubId),
          where('userId', '==', claimData.userId),
          where('status', '==', 'pending')
        );
        const existingSnap = await getDocs(existing);
        if (!existingSnap.empty) {
          return { success: false, error: 'Již máte aktivní žádost o převzetí tohoto kroužku.' };
        }

        const docRef = await addDoc(claimsRef, {
          ...claimData,
          status: 'pending',
          createdAt: new Date().toISOString(),
          resolvedAt: null,
          resolvedBy: null,
        });

        return { success: true, claimId: docRef.id };
      } catch (err: unknown) {
        const error = err as { message?: string };
        const errorMessage = error.message || 'Chyba při odesílání žádosti';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const fetchClaims = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      if (!db) throw new Error('Firebase není nakonfigurován');

      const claimsRef = collection(db, 'claimRequests');
      const q = query(claimsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const claims: ClaimRequest[] = [];
      snapshot.forEach((doc) => {
        claims.push({ id: doc.id, ...doc.data() } as ClaimRequest);
      });
      return claims;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Chyba při načítání žádostí');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const resolveClaim = useCallback(
    async (claimId: string, status: 'approved' | 'rejected', resolvedBy: string, clubId?: string, newOwnerId?: string) => {
      try {
        setError(null);
        if (!db) throw new Error('Firebase není nakonfigurován');

        // Update claim status
        const claimRef = doc(db, 'claimRequests', claimId);
        await updateDoc(claimRef, {
          status,
          resolvedAt: new Date().toISOString(),
          resolvedBy,
        });

        // If approved, transfer club ownership
        if (status === 'approved' && clubId && newOwnerId) {
          const clubRef = doc(db, 'clubs', clubId);
          await updateDoc(clubRef, {
            createdBy: newOwnerId,
          });
        }

        return { success: true };
      } catch (err: unknown) {
        const error = err as { message?: string };
        const errorMessage = error.message || 'Chyba při zpracování žádosti';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  return { submitClaim, fetchClaims, resolveClaim, loading, error };
};
