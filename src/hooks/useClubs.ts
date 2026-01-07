'use client';

import { useState, useCallback } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  QueryConstraint,
  where,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface Club {
  id: string;
  name: string;
  category: string;
  description: string;
  address: string;
  dayTime: string;
  trainerName: string;
  trainerEmail: string;
  trainerPhone: string;
  web: string;
  ageFrom: number;
  ageTo: number;
  level: string;
  capacity: number;
  price: number;
  image?: string;
  createdAt: string;
  createdBy: string;
  status?: 'pending' | 'approved' | 'rejected';
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  rejectReason?: string | null;
}

export const useClubs = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload club image to Firebase Storage
  const uploadClubImage = useCallback(async (file: File, clubId: string): Promise<string | null> => {
    try {
      if (!storage) {
        throw new Error('Firebase Storage není nakonfigurován');
      }

      // Create a unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `clubs/${clubId}/${timestamp}.${fileExtension}`;
      
      const storageRef = ref(storage, fileName);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (err: unknown) {
      console.error('Image upload error:', err);
      const error = err as { message?: string };
      setError(error.message || 'Chyba při nahrávání obrázku');
      return null;
    }
  }, []);

  // Create club
  const createClub = useCallback(
    async (clubData: Omit<Club, 'id' | 'createdAt' | 'createdBy'>, userId: string) => {
      try {
        setError(null);

        if (!db) {
          throw new Error('Firebase není nakonfigurován');
        }

        const clubsRef = collection(db, 'clubs');
        const docRef = await addDoc(clubsRef, {
          ...clubData,
          createdAt: new Date().toISOString(),
          createdBy: userId,
          status: 'pending',
          approvedAt: null,
          approvedBy: null,
          rejectedAt: null,
          rejectedBy: null,
          rejectReason: null,
        });

        return { success: true, clubId: docRef.id };
      } catch (err: unknown) {
        const error = err as { message?: string };
        const errorMessage = error.message || 'Chyba při vytváření kroužku';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Fetch all clubs
  const fetchClubs = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      if (!db) {
        throw new Error('Firebase není nakonfigurován');
      }

      const clubsRef = collection(db, 'clubs');
      const q = query(clubsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const clubs: Club[] = [];
      querySnapshot.forEach((doc) => {
        clubs.push({
          id: doc.id,
          ...doc.data(),
        } as Club);
      });

      return clubs.filter((club) => !club.status || club.status === 'approved');
    } catch (err: unknown) {
      const error = err as { message?: string };
      const errorMessage = error.message || 'Chyba při načítání kroužků';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Admin: fetch all clubs including pending
  const fetchClubsAdmin = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      if (!db) {
        throw new Error('Firebase není nakonfigurován');
      }

      const clubsRef = collection(db, 'clubs');
      const q = query(clubsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const clubs: Club[] = [];
      querySnapshot.forEach((doc) => {
        clubs.push({
          id: doc.id,
          ...doc.data(),
        } as Club);
      });

      return clubs;
    } catch (err: unknown) {
      const error = err as { message?: string };
      const errorMessage = error.message || 'Chyba při načítání kroužků (admin)';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch clubs by category
  const fetchClubsByCategory = useCallback(
    async (category: string) => {
      try {
        setError(null);
        setLoading(true);

        if (!db) {
          throw new Error('Firebase není nakonfigurován');
        }

        const clubsRef = collection(db, 'clubs');
        const q = query(
          clubsRef,
          where('category', '==', category),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);

        const clubs: Club[] = [];
        querySnapshot.forEach((doc) => {
          clubs.push({
            id: doc.id,
            ...doc.data(),
          } as Club);
        });

        return clubs.filter((club) => !club.status || club.status === 'approved');
      } catch (err: unknown) {
        const error = err as { message?: string };
        const errorMessage = error.message || 'Chyba při načítání kroužků';
        setError(errorMessage);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch clubs created by a specific user (includes all statuses)
  const fetchClubsByUser = useCallback(
    async (userId: string) => {
      try {
        setError(null);
        setLoading(true);

        if (!db) {
          throw new Error('Firebase není nakonfigurován');
        }

        console.log('Fetching clubs for user:', userId);
        const clubsRef = collection(db, 'clubs');
        // Remove orderBy to avoid requiring a composite index
        const q = query(
          clubsRef,
          where('createdBy', '==', userId)
        );
        const querySnapshot = await getDocs(q);

        const clubs: Club[] = [];
        querySnapshot.forEach((doc) => {
          clubs.push({
            id: doc.id,
            ...doc.data(),
          } as Club);
        });

        // Sort on client side instead
        clubs.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA; // descending order
        });

        console.log('Fetched clubs:', clubs.length, clubs);
        return clubs;
      } catch (err: unknown) {
        const error = err as { message?: string };
        const errorMessage = error.message || 'Chyba při načítání kroužků uživatele';
        console.error('Error fetching clubs by user:', errorMessage, err);
        setError(errorMessage);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch single club by ID
  const fetchClubById = useCallback(async (clubId: string) => {
    try {
      setError(null);
      setLoading(true);

      if (!db) {
        throw new Error('Firebase není nakonfigurován');
      }

      const clubRef = doc(db, 'clubs', clubId);
      const clubSnap = await getDoc(clubRef);

      if (clubSnap.exists()) {
        return {
          id: clubSnap.id,
          ...clubSnap.data(),
        } as Club;
      } else {
        setError('Kroužek nebyl nalezen');
        return null;
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      const errorMessage = error.message || 'Chyba při načítání kroužku';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update club
  const updateClub = useCallback(
    async (
      clubId: string,
      clubData: Partial<
        Omit<
          Club,
          'id' | 'createdAt' | 'createdBy' | 'status' | 'approvedAt' | 'approvedBy' | 'rejectedAt' | 'rejectedBy' | 'rejectReason'
        >
      >
    ) => {
      try {
        setError(null);

        if (!db) {
          throw new Error('Firebase není nakonfigurován');
        }

        const clubRef = doc(db, 'clubs', clubId);
        await updateDoc(clubRef, {
          ...clubData,
          updatedAt: new Date().toISOString(),
        });

        return { success: true };
      } catch (err: unknown) {
        const error = err as { message?: string };
        const errorMessage = error.message || 'Chyba při aktualizaci kroužku';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Admin: set approval status
  const setClubStatus = useCallback(
    async (
      clubId: string,
      status: 'pending' | 'approved' | 'rejected',
      approvedBy?: string | null,
      reason?: string | null
    ) => {
      try {
        setError(null);

        if (!db) {
          throw new Error('Firebase není nakonfigurován');
        }

        const clubRef = doc(db, 'clubs', clubId);
        await updateDoc(clubRef, {
          status,
          approvedAt: status === 'approved' ? new Date().toISOString() : null,
          approvedBy: status === 'approved' ? approvedBy || null : null,
          rejectedAt: status === 'rejected' ? new Date().toISOString() : null,
          rejectedBy: status === 'rejected' ? approvedBy || null : null,
          rejectReason: status === 'rejected' ? reason || null : null,
          updatedAt: new Date().toISOString(),
        });

        return { success: true };
      } catch (err: unknown) {
        const error = err as { message?: string };
        const errorMessage = error.message || 'Chyba při změně stavu kroužku';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  return {
    createClub,
    updateClub,
    fetchClubs,
    fetchClubsAdmin,
    setClubStatus,
    fetchClubsByCategory,
    fetchClubsByUser,
    fetchClubById,
    uploadClubImage,
    loading,
    error,
  };
};
