'use client';

import { useState, useCallback } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  specialization: string;
  experience: number;
  image?: string;
  createdAt: string;
  createdBy: string;
}

export const useTrainers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload trainer image to Firebase Storage
  const uploadTrainerImage = useCallback(async (file: File, trainerId: string): Promise<string | null> => {
    try {
      if (!storage) {
        throw new Error('Firebase Storage není nakonfigurován');
      }

      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `trainers/${trainerId}/${timestamp}.${fileExtension}`;
      
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (err: any) {
      console.error('Image upload error:', err);
      setError(err.message || 'Chyba při nahrávání obrázku');
      return null;
    }
  }, []);

  // Create trainer
  const createTrainer = useCallback(
    async (trainerData: Omit<Trainer, 'id' | 'createdAt' | 'createdBy'>, userId: string) => {
      try {
        setError(null);

        if (!db) {
          throw new Error('Firebase není nakonfigurován');
        }

        const trainersRef = collection(db, 'trainers');
        const docRef = await addDoc(trainersRef, {
          ...trainerData,
          createdAt: new Date().toISOString(),
          createdBy: userId,
        });

        return { success: true, trainerId: docRef.id };
      } catch (err: any) {
        const errorMessage = err.message || 'Chyba při vytváření profilu';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  // Fetch all trainers
  const fetchTrainers = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      if (!db) {
        throw new Error('Firebase není nakonfigurován');
      }

      const trainersRef = collection(db, 'trainers');
      const q = query(trainersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const trainers: Trainer[] = [];
      querySnapshot.forEach((doc) => {
        trainers.push({
          id: doc.id,
          ...doc.data(),
        } as Trainer);
      });

      return trainers;
    } catch (err: any) {
      const errorMessage = err.message || 'Chyba při načítání trenérů';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single trainer by ID
  const fetchTrainerById = useCallback(async (trainerId: string) => {
    try {
      setError(null);
      setLoading(true);

      if (!db) {
        throw new Error('Firebase není nakonfigurován');
      }

      const trainerRef = doc(db, 'trainers', trainerId);
      const trainerSnap = await getDoc(trainerRef);

      if (trainerSnap.exists()) {
        return {
          id: trainerSnap.id,
          ...trainerSnap.data(),
        } as Trainer;
      } else {
        setError('Trenér nebyl nalezen');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Chyba při načítání trenéra';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update trainer
  const updateTrainer = useCallback(
    async (trainerId: string, trainerData: Partial<Omit<Trainer, 'id' | 'createdAt' | 'createdBy'>>) => {
      try {
        setError(null);

        if (!db) {
          throw new Error('Firebase není nakonfigurován');
        }

        const trainerRef = doc(db, 'trainers', trainerId);
        await updateDoc(trainerRef, {
          ...trainerData,
          updatedAt: new Date().toISOString(),
        });

        return { success: true };
      } catch (err: any) {
        const errorMessage = err.message || 'Chyba při aktualizaci profilu';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  return {
    createTrainer,
    updateTrainer,
    fetchTrainers,
    fetchTrainerById,
    uploadTrainerImage,
    loading,
    error,
  };
};
