
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
          // Use timeout for fetching as well to prevent hangs on load
          const docSnap = await withTimeout(getDoc(docRef), 10000);
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
        // No user or db, so reset config and consider it "loaded"
        setConfig(emptyConfig);
        setIsConfigLoaded(true);
      }
    };

    fetchConfig();
  }, [user]);

  const saveAzureDevOpsConfig = useCallback(async (newConfig: AzureDevOpsConfig) => {
    if (!user || !db) {
      console.warn("Cannot save config, no user is logged in or DB is not available.");
      throw new Error("User not authenticated or database not available.");
    }
    const docRef = doc(db, "userConfigs", user.uid);
    // Use the timeout helper here. 10 seconds is a reasonable timeout.
    await withTimeout(setDoc(docRef, newConfig, { merge: true }), 10000);
    setConfig(newConfig);
  }, [user]);

  const clearAzureDevOpsConfig = useCallback(async () => {
    if (!user || !db) {
      console.warn("Cannot clear config, no user is logged in or DB is not available.");
      throw new Error("User not authenticated or database not available.");
    }
    const docRef = doc(db, "userConfigs", user.uid);
    await withTimeout(deleteDoc(docRef), 10000);
    setConfig(emptyConfig);
  }, [user]);

  return { config, saveAzureDevOpsConfig, clearAzureDevOpsConfig, isConfigLoaded };
}
