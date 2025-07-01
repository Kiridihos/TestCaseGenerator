
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface AzureDevOpsConfig {
  pat: string | null;
  organization: string | null;
  project: string | null;
}

export interface ConfigResult {
    success: boolean;
    error?: string;
}

const emptyConfig: AzureDevOpsConfig = { pat: null, organization: null, project: null };

// Helper to add a timeout to a promise
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);

    promise.then(
      (res) => {
        clearTimeout(timeoutId);
        resolve(res);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
}


export function useAzureDevOpsConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<AzureDevOpsConfig>(emptyConfig);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      if (user && db) {
        setIsConfigLoaded(false);
        try {
          const docRef = doc(db, "userConfigs", user.uid);
          // Removed withTimeout from initial fetch to prevent unhandled rejection on page load
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setConfig(docSnap.data() as AzureDevOpsConfig);
          } else {
            setConfig(emptyConfig);
          }
        } catch (error) {
          console.error("Failed to fetch user config from Firestore:", error);
          setConfig(emptyConfig);
        } finally {
          setIsConfigLoaded(true);
        }
      } else {
        setConfig(emptyConfig);
        setIsConfigLoaded(true);
      }
    };

    fetchConfig();
  }, [user]);

  const saveAzureDevOpsConfig = useCallback(async (newConfig: AzureDevOpsConfig): Promise<ConfigResult> => {
    if (!user || !db) {
      const errorMsg = "User not authenticated or database not available.";
      console.warn("Cannot save config:", errorMsg);
      return { success: false, error: errorMsg };
    }
    try {
      const docRef = doc(db, "userConfigs", user.uid);
      await withTimeout(setDoc(docRef, newConfig, { merge: true }), 10000);
      setConfig(newConfig);
      return { success: true };
    } catch (error) {
      console.error("Failed to save config to Firestore:", error);
      let errorMsg = "Could not save your configuration. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          errorMsg = "Permission Denied. Please check your Firestore security rules to allow writes.";
        } else if (error.message.includes('timed out')) {
          errorMsg = "The request timed out. Please check your internet connection and ensure Firestore is enabled in your Firebase project console.";
        }
      }
      return { success: false, error: errorMsg };
    }
  }, [user]);

  const clearAzureDevOpsConfig = useCallback(async (): Promise<ConfigResult> => {
    if (!user || !db) {
      const errorMsg = "User not authenticated or database not available.";
      console.warn("Cannot clear config:", errorMsg);
      return { success: false, error: errorMsg };
    }
    try {
      const docRef = doc(db, "userConfigs", user.uid);
      await withTimeout(deleteDoc(docRef), 10000);
      setConfig(emptyConfig);
      return { success: true };
    } catch (error) {
      console.error("Failed to clear config from Firestore:", error);
      let errorMsg = "Could not clear your configuration. Please try again.";
      if (error instanceof Error && error.message.includes('timed out')) {
          errorMsg = "The request timed out. Please check your internet connection.";
      }
      return { success: false, error: errorMsg };
    }
  }, [user]);

  return { config, saveAzureDevOpsConfig, clearAzureDevOpsConfig, isConfigLoaded };
}
