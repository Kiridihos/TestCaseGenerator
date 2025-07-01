
"use client";

import { useAzureDevOpsConfig } from "@/hooks/useApiKey";
import { KeyRound, Building, FolderGit2, Loader2, AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function ConfigurationForm() {
  const { config, isConfigLoaded } = useAzureDevOpsConfig();
  
  const isConfigPresent = !!config.pat && !!config.organization && !!config.project;

  if (!isConfigLoaded) {
    return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4">Loading configuration...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
        {!isConfigPresent ? (
             <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Configuración Global Faltante</AlertTitle>
                <AlertDescription>
                    La configuración de Azure DevOps no se ha encontrado. Por favor, define las siguientes variables de entorno en tu archivo <strong>.env</strong> para habilitar la integración:
                    <ul className="list-disc pl-5 mt-2 font-mono text-xs">
                        <li>NEXT_PUBLIC_ADO_PAT</li>
                        <li>NEXT_PUBLIC_ADO_ORGANIZATION</li>
                        <li>NEXT_PUBLIC_ADO_PROJECT</li>
                    </ul>
                </AlertDescription>
            </Alert>
        ) : (
            <>
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Configuración Global</AlertTitle>
                    <AlertDescription>
                        Esta aplicación está utilizando una configuración global de Azure DevOps definida en las variables de entorno. Estos valores son de solo lectura.
                    </AlertDescription>
                </Alert>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" /> Azure DevOps Personal Access Token (PAT)
                    </Label>
                    <Input type="password" value={config.pat || ""} readOnly />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" /> Azure DevOps Organization
                    </Label>
                    <Input value={config.organization || ""} readOnly />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <FolderGit2 className="h-5 w-5 text-primary" /> Azure DevOps Project
                    </Label>
                    <Input value={config.project || ""} readOnly />
                </div>
            </>
        )}
    </div>
  );
}
