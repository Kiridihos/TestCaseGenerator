
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
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
  const { toast } = useToast();

  const loadAzureDevOpsConfig = useCallback(async () => {
    // This function can be called to force a reload of the config.
    setIsConfigLoaded(false);

    // Define the global default configuration from the .env file
    const defaultConfigFromEnv: AzureDevOpsConfig = {
      pat: process.env.NEXT_PUBLIC_AZURE_DEVOPS_PAT || "",
      organization: process.env.NEXT_PUBLIC_AZURE_DEVOPS_ORGANIZATION || "",
      project: process.env.NEXT_PUBLIC_AZURE_DEVOPS_PROJECT || ""
    };
    
    if (!user) {
      // If no user, there's no personal config. Use the default from .env
      setConfig(defaultConfigFromEnv);
      setIsUsingDefaultConfig(true);
      setIsConfigLoaded(true);
      return;
    }

    if (!db) {
      console.warn("Firestore is not available. Falling back to default .env config.");
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
      toast({
        variant: "destructive",
        title: "Error al Cargar Configuración Personal",
        description: "No se pudo obtener tu configuración. Asegúrate de que has creado una base de datos Firestore y has configurado las reglas de seguridad correctamente."
      });
      setConfig(defaultConfigFromEnv);
      setIsUsingDefaultConfig(true);
    } finally {
      setIsConfigLoaded(true);
    }
  }, [user, toast]);

  const saveAzureDevOpsConfig = async (newConfig: AzureDevOpsConfig): Promise<{success: boolean; error?: string}> => {
    if (!user || !db) {
      return { success: false, error: "User not authenticated or database not available." };
    }
    try {
      const docRef = doc(db, "userConfigs", user.uid);
      await setDoc(docRef, newConfig, { merge: true });
      setConfig(newConfig);
      setIsUsingDefaultConfig(false);
      return { success: true };
    } catch (error: any) {
        console.error("Error saving config:", error);
        return { success: false, error: "Failed to save configuration to the database."};
    }
  };
  
  const clearAzureDevOpsConfig = async (): Promise<{success: boolean; error?: string}> => {
     if (!user || !db) {
      return { success: false, error: "User not authenticated or database not available." };
    }
    try {
      const docRef = doc(db, "userConfigs", user.uid);
      await deleteDoc(docRef);
      const defaultConfigFromEnv: AzureDevOpsConfig = {
        pat: process.env.NEXT_PUBLIC_AZURE_DEVOPS_PAT || "",
        organization: process.env.NEXT_PUBLIC_AZURE_DEVOPS_ORGANIZATION || "",
        project: process.env.NEXT_PUBLIC_AZURE_DEVOPS_PROJECT || ""
      };
      setConfig(defaultConfigFromEnv);
      setIsUsingDefaultConfig(true);
      return { success: true };
    } catch (error: any) {
      console.error("Error clearing config:", error);
      return { success: false, error: "Failed to clear personal configuration."};
    }
  }
  
  useEffect(() => {
    loadAzureDevOpsConfig();
  }, [loadAzureDevOpsConfig]);

  return { config, isConfigLoaded, saveAzureDevOpsConfig, clearAzureDevOpsConfig, isUsingDefaultConfig, loadAzureDevOpsConfig };
}
