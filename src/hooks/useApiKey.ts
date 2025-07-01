
"use client";

import { useState, useEffect, useCallback } from 'react';

const ADO_CONFIG_STORAGE_KEY = 'azureDevOpsConfig';

export interface AzureDevOpsConfig {
  pat: string | null;
  organization: string | null;
  project: string | null;
}

// Read from environment variables
const envConfig = {
    pat: process.env.NEXT_PUBLIC_ADO_PAT || null,
    organization: process.env.NEXT_PUBLIC_ADO_ORGANIZATION || null,
    project: process.env.NEXT_PUBLIC_ADO_PROJECT || null,
};

// Check if the global config is fully provided in the environment
const isFromEnv = !!(envConfig.pat && envConfig.organization && envConfig.project);

export function useAzureDevOpsConfig() {
  const [config, setConfig] = useState<AzureDevOpsConfig>({ pat: null, organization: null, project: null });
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  useEffect(() => {
    // If config is from environment, use it directly.
    if (isFromEnv) {
        setConfig(envConfig);
        setIsConfigLoaded(true);
    } else {
        // Otherwise, try to load from localStorage.
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
    }
  }, []); // Run only once on mount

  const saveAzureDevOpsConfig = useCallback((newConfig: AzureDevOpsConfig) => {
    // Do not save if config is from environment variables
    if (isFromEnv) {
      console.warn("Configuration is managed by environment variables. Cannot save locally.");
      return;
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADO_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
        setConfig(newConfig);
      } catch (error) {
        console.error("Failed to save to localStorage:", error);
      }
    }
  }, []);

  const clearAzureDevOpsConfig = useCallback(() => {
    // Do not clear if config is from environment variables
    if (isFromEnv) {
      console.warn("Configuration is managed by environment variables. Cannot clear locally.");
      return;
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(ADO_CONFIG_STORAGE_KEY);
        setConfig({ pat: null, organization: null, project: null });
      } catch (error) {
        console.error("Failed to remove from localStorage:", error);
      }
    }
  }, []);

  return { config, saveAzureDevOpsConfig, clearAzureDevOpsConfig, isConfigLoaded, isFromEnv };
}
