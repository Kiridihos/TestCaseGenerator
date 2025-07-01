
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
    await setDoc(docRef, newConfig, { merge: true });
    setConfig(newConfig);
  }, [user]);

  const clearAzureDevOpsConfig = useCallback(async () => {
    if (!user || !db) {
      console.warn("Cannot clear config, no user is logged in or DB is not available.");
      throw new Error("User not authenticated or database not available.");
    }
    const docRef = doc(db, "userConfigs", user.uid);
    await deleteDoc(docRef);
    setConfig(emptyConfig);
  }, [user]);

  return { config, saveAzureDevOpsConfig, clearAzureDevOpsConfig, isConfigLoaded };
}
