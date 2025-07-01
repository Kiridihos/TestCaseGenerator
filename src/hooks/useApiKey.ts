
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const ADO_CONFIG_STORAGE_KEY_PREFIX = 'azureDevOpsConfig_';

export interface AzureDevOpsConfig {
  pat: string | null;
  organization: string | null;
  project: string | null;
}

export function useAzureDevOpsConfig() {
  const { user } = useAuth();
  const [config, setConfig] = useState<AzureDevOpsConfig>({ pat: null, organization: null, project: null });
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  const storageKey = user ? `${ADO_CONFIG_STORAGE_KEY_PREFIX}${user.uid}` : null;

  useEffect(() => {
    if (!storageKey) {
        setConfig({ pat: null, organization: null, project: null });
        setIsConfigLoaded(true);
        return;
    }

    if (typeof window !== 'undefined') {
        setIsConfigLoaded(false);
        try {
            const storedConfigString = localStorage.getItem(storageKey);
            if (storedConfigString) {
              const storedConfig = JSON.parse(storedConfigString) as AzureDevOpsConfig;
              setConfig(storedConfig);
            } else {
              setConfig({ pat: null, organization: null, project: null });
            }
        } catch (error) {
            console.error("Failed to access localStorage or parse config:", error);
            setConfig({ pat: null, organization: null, project: null });
        } finally {
            setIsConfigLoaded(true);
        }
    }
  }, [storageKey]);

  const saveAzureDevOpsConfig = useCallback((newConfig: AzureDevOpsConfig) => {
    if (!storageKey) {
      console.warn("Cannot save config, no user is logged in.");
      return;
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newConfig));
        setConfig(newConfig);
      } catch (error) {
        console.error("Failed to save to localStorage:", error);
      }
    }
  }, [storageKey]);

  const clearAzureDevOpsConfig = useCallback(() => {
    if (!storageKey) {
        console.warn("Cannot clear config, no user is logged in.");
        return;
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
        setConfig({ pat: null, organization: null, project: null });
      } catch (error) {
        console.error("Failed to remove from localStorage:", error);
      }
    }
  }, [storageKey]);

  return { config, saveAzureDevOpsConfig, clearAzureDevOpsConfig, isConfigLoaded };
}
