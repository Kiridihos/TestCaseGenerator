
"use client";

import { useState, useEffect } from 'react';

export interface AzureDevOpsConfig {
  pat: string | null;
  organization: string | null;
  project: string | null;
}

const emptyConfig: AzureDevOpsConfig = { pat: null, organization: null, project: null };

export function useAzureDevOpsConfig() {
  const [config, setConfig] = useState<AzureDevOpsConfig>(emptyConfig);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  useEffect(() => {
    // Read from environment variables
    const pat = process.env.NEXT_PUBLIC_ADO_PAT || null;
    const organization = process.env.NEXT_PUBLIC_ADO_ORGANIZATION || null;
    const project = process.env.NEXT_PUBLIC_ADO_PROJECT || null;
    
    setConfig({ pat, organization, project });
    setIsConfigLoaded(true);
  }, []);

  return { config, isConfigLoaded };
}
