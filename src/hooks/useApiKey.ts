
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, type FirestoreError } from "firebase/firestore";
import { useToast } from './use-toast';

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
  const [isUsingDefaultConfig, setIsUsingDefaultConfig] = useState(false);
  const [personalConfigError, setPersonalConfigError] = useState<FirestoreError | null>(null);
  const { toast } = useToast();

  const loadAzureDevOpsConfig = useCallback(async () => {
    // This function can be called to force a reload of the config.
    setIsConfigLoaded(false);
    setPersonalConfigError(null);

    // Define the global default configuration from the .env file
    const defaultConfigFromEnv: AzureDevOpsConfig = {
      pat: process.env.NEXT_PUBLIC_AZURE_DEVOPS_PAT || "",
      organization: process.env.NEXT_PUBLIC_AZURE_DEVOPS_ORGANIZATION || "",
      project: process.env.NEXT_PUBLIC_AZURE_DEVOPS_PROJECT || ""
    };
    
    if (!user || !db) {
      // If no user, or no DB, there's no personal config. Use the default from .env
      setConfig(defaultConfigFromEnv);
      setIsUsingDefaultConfig(true);
      setIsConfigLoaded(true);
      return;
    }
    
    try {
      const docRef = doc(db, "userConfigs", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setConfig(docSnap.data() as AzureDevOpsConfig);
        setIsUsingDefaultConfig(false);
      } else {
        setConfig(defaultConfigFromEnv);
        setIsUsingDefaultConfig(true);
      }
    } catch (error) {
      console.error("Error loading Azure DevOps config from Firestore:", error);
      setPersonalConfigError(error as FirestoreError);
      setConfig(defaultConfigFromEnv); // Fallback to default on error
      setIsUsingDefaultConfig(true);
    } finally {
      setIsConfigLoaded(true);
    }
  }, [user]);

  const saveAzureDevOpsConfig = async (newConfig: AzureDevOpsConfig): Promise<{success: boolean; error?: string}> => {
    if (!user || !db) {
      const errorMsg = "User not authenticated or database not available.";
      toast({ variant: "destructive", title: "Error", description: errorMsg });
      return { success: false, error: errorMsg };
    }
    try {
      const docRef = doc(db, "userConfigs", user.uid);
      await setDoc(docRef, newConfig, { merge: true });
      setConfig(newConfig);
      setIsUsingDefaultConfig(false);
      setPersonalConfigError(null);
      toast({ title: "Configuration Saved", description: "Your personal Azure DevOps settings have been saved." });
      return { success: true };
    } catch (error: any) {
        console.error("Error saving config:", error);
        const errorMsg = "Could not save configuration. Please check your Firestore rules.";
        toast({ variant: "destructive", title: "Error Saving", description: errorMsg });
        return { success: false, error: errorMsg};
    }
  };
  
  const clearAzureDevOpsConfig = async (): Promise<{success: boolean; error?: string}> => {
     if (!user || !db) {
      const errorMsg = "User not authenticated or database not available.";
      toast({ variant: "destructive", title: "Error", description: errorMsg });
      return { success: false, error: errorMsg };
    }
    try {
      const docRef = doc(db, "userConfigs", user.uid);
      await deleteDoc(docRef);
      await loadAzureDevOpsConfig(); // Reload to get default config
      toast({ title: "Configuration Cleared", description: "Personal settings removed. Using default config." });
      return { success: true };
    } catch (error: any) {
      console.error("Error clearing config:", error);
      const errorMsg = "Could not clear configuration. Please check your Firestore rules.";
      toast({ variant: "destructive", title: "Error Clearing", description: errorMsg });
      return { success: false, error: errorMsg};
    }
  }
  
  useEffect(() => {
    loadAzureDevOpsConfig();
  }, [loadAzureDevOpsConfig]);

  return { config, isConfigLoaded, saveAzureDevOpsConfig, clearAzureDevOpsConfig, isUsingDefaultConfig, personalConfigError, loadAzureDevOpsConfig };
}
