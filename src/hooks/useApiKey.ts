"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface AzureDevOpsConfig {
  pat: string;
  organization: string;
  project: string;
}

const emptyConfig: AzureDevOpsConfig = { pat: '', organization: '', project: '' };

export function useAzureDevOpsConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<AzureDevOpsConfig>(emptyConfig);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  const loadAzureDevOpsConfig = useCallback(async () => {
    if (!user || !db) {
      setIsConfigLoaded(true);
      return;
    }
    
    try {
      const docRef = doc(db, "userConfigs", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setConfig(docSnap.data() as AzureDevOpsConfig);
      } else {
        setConfig(emptyConfig);
      }
    } catch (error) {
      console.error("Error loading Azure DevOps config from Firestore:", error);
      setConfig(emptyConfig);
    } finally {
      setIsConfigLoaded(true);
    }
  }, [user]);

  const saveAzureDevOpsConfig = async (newConfig: AzureDevOpsConfig): Promise<void> => {
    if (!user || !db) {
      throw new Error("User not authenticated or database not available.");
    }
    const docRef = doc(db, "userConfigs", user.uid);
    await setDoc(docRef, newConfig, { merge: true });
    setConfig(newConfig);
  };
  
  useEffect(() => {
    loadAzureDevOpsConfig();
  }, [loadAzureDevOpsConfig]);

  return { config, isConfigLoaded, saveAzureDevOpsConfig, loadAzureDevOpsConfig };
}
