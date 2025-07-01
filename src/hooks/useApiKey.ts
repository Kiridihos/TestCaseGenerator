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
    if (!user) {
      setIsConfigLoaded(true);
      return;
    }
    
    // Default to .env variables if available, especially for new users
    const defaultConfig: AzureDevOpsConfig = {
        pat: process.env.NEXT_PUBLIC_AZURE_DEVOPS_PAT || "",
        organization: process.env.NEXT_PUBLIC_AZURE_DEVOPS_ORGANIZATION || "",
        project: process.env.NEXT_PUBLIC_AZURE_DEVOPS_PROJECT || ""
    };

    if (!db) {
      console.warn("Firestore is not available. Falling back to default config.");
      setConfig(defaultConfig);
      setIsConfigLoaded(true);
      return;
    }
    
    try {
      const docRef = doc(db, "userConfigs", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setConfig(docSnap.data() as AzureDevOpsConfig);
      } else {
        // If user has no config in Firestore, use the default from .env
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error("Error loading Azure DevOps config from Firestore:", error);
      // Fallback to default on error
      setConfig(defaultConfig);
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
