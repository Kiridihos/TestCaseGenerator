
"use client";

import { useState, useEffect, useCallback } from 'react';

const ADO_CONFIG_STORAGE_KEY = 'azureDevOpsConfig';

export interface AzureDevOpsConfig {
  pat: string | null;
  organization: string | null;
  project: string | null;
}

export function useAzureDevOpsConfig() {
  const [config, setConfig] = useState<AzureDevOpsConfig>({ pat: null, organization: null, project: null });
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedConfigString = localStorage.getItem(ADO_CONFIG_STORAGE_KEY);
        if (storedConfigString) {
          const storedConfig = JSON.parse(storedConfigString) as AzureDevOpsConfig;
          setConfig(storedConfig);
        }
      } catch (error) {
        console.error("Failed to access localStorage or parse config:", error);
      } finally {
        setIsConfigLoaded(true);
      }
    }
  }, []);

  const saveAzureDevOpsConfig = useCallback((newConfig: AzureDevOpsConfig) => {
    if (typeof window !== 'undefined') {
      if (!newConfig.pat || !newConfig.organization || !newConfig.project) {
        console.error("PAT, Organization, and Project are required to save config.");
        // Optionally, you could throw an error or handle this more gracefully
        return;
      }
      try {
        localStorage.setItem(ADO_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
        setConfig(newConfig);
      } catch (error) {
        console.error("Failed to save to localStorage:", error);
      }
    }
  }, []);

  const clearAzureDevOpsConfig = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(ADO_CONFIG_STORAGE_KEY);
        setConfig({ pat: null, organization: null, project: null });
      } catch (error) {
        console.error("Failed to remove from localStorage:", error);
      }
    }
  }, []);

  return { config, saveAzureDevOpsConfig, clearAzureDevOpsConfig, isConfigLoaded };
}
