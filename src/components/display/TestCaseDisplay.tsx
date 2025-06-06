
"use client";

import { useState } from "react";
import type { TestCase } from "@/ai/flows/generate-test-cases"; // Import TestCase type
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAzureDevOpsConfig } from "@/hooks/useApiKey";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ListChecks, UploadCloud, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";

interface TestCaseDisplayProps {
  testCases: TestCase[]; // Updated to use the new TestCase type
}

export function TestCaseDisplay({ testCases }: TestCaseDisplayProps) {
  const { config: devOpsConfig, isConfigLoaded } = useAzureDevOpsConfig();
  const { toast } = useToast();
  const [pbiId, setPbiId] = useState("");
  const [isPushing, setIsPushing] = useState(false);

  const formatStepsToHtml = (steps: Array<{ action: string; expectedResult: string }>): string => {
    if (!steps || steps.length === 0) {
      return '<p>No se proporcionaron pasos detallados.</p>';
    }

    let html = '<table style="border-collapse: collapse; width: 100%;" border="1"><thead><tr>';
    html += '<th style="background-color: #f2f2f2; padding: 8px; text-align: left;">Paso</th>';
    html += '<th style="background-color: #f2f2f2; padding: 8px; text-align: left;">Acción</th>';
    html += '<th style="background-color: #f2f2f2; padding: 8px; text-align: left;">Resultado Esperado</th>';
    html += '</tr></thead><tbody>';

    steps.forEach((step, index) => {
      const actionText = step.action && step.action.trim() !== "" ? step.action.replace(/\n/g, '<br />') : '<i>(sin acción especificada)</i>';
      const expectedResultText = step.expectedResult && step.expectedResult.trim() !== "" ? step.expectedResult.replace(/\n/g, '<br />') : '<i>(sin resultado esperado especificado)</i>';
      
      html += '<tr>';
      html += `<td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>`;
      html += `<td style="padding: 8px; border: 1px solid #ddd;">${actionText}</td>`;
      html += `<td style="padding: 8px; border: 1px solid #ddd;">${expectedResultText}</td>`;
      html += '</tr>';
    });

    html += '</tbody></table>';
    return `<div>${html}</div>`;
  };


  const handlePushToDevOps = async () => {
    if (!isConfigLoaded) {
      toast({
        title: "Cargando Configuración",
        description: "Por favor espera mientras verificamos tu configuración de Azure DevOps.",
        variant: "default"
      });
      return;
    }

    if (!devOpsConfig.pat || !devOpsConfig.organization || !devOpsConfig.project) {
      toast({
        title: "Configuración de Azure DevOps Incompleta",
        description: (
          <div className="flex flex-col gap-2">
            <p>Por favor configura tu PAT, Organización y Proyecto en ajustes para enviar casos de prueba.</p>
            <Link href="/configure" legacyBehavior passHref>
              <Button variant="outline" size="sm">Ir a Configuración</Button>
            </Link>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    if (!pbiId.trim()) {
      toast({
        title: "ID de PBI Faltante",
        description: "Por favor ingresa el ID del Product Backlog Item para asociar los casos de prueba.",
        variant: "destructive",
      });
      return;
    }

    setIsPushing(true);
    let successCount = 0;
    let errorCount = 0;

    const { pat, organization, project } = devOpsConfig;

    for (const tc of testCases) {
      const apiUrl = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/$Test Case?api-version=7.1-preview.3`;
      
      // Logging los datos del TC y el HTML de los pasos
      console.log(`Datos del TC a enviar para "${tc.title}":`, JSON.stringify(tc, null, 2));
      const htmlReproSteps = formatStepsToHtml(tc.steps);
      console.log(`HTML Repro Steps para "${tc.title}":`, htmlReproSteps);

      const body = [
        {
          "op": "add",
          "path": "/fields/System.Title",
          "value": tc.title 
        },
        {
          "op": "add",
          "path": "/fields/System.Description", 
          "value": tc.description ? tc.description.replace(/\n/g, '<br />') : ""
        },
        {
          "op": "add",
          "path": "/fields/Microsoft.VSTS.TCM.ReproSteps",
          "value": htmlReproSteps
        },
        {
          "op": "add",
          "path": "/relations/-",
          "value": {
            "rel": "System.LinkTypes.Hierarchy-Reverse", 
            "url": `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${pbiId}`,
            "attributes": {
              "name": "Parent"
            }
          }
        }
      ];

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json-patch+json",
            "Authorization": `Basic ${btoa(":" + pat!)}`
          },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          successCount++;
        } else {
          const errorData = await response.json();
          console.error(`Fallo al crear Caso de Prueba "${tc.title}":`, response.status, errorData);
          errorCount++;
          toast({
            title: `Error Creando TC: ${tc.title.substring(0,30)}...`,
            description: `Error API Azure DevOps: ${errorData.message || response.statusText}. Revisa la consola.`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error(`Error de red u otro para Caso de Prueba "${tc.title}":`, error);
        errorCount++;
         toast({
            title: `Error Enviando TC: ${tc.title.substring(0,30)}...`,
            description: `Ocurrió un error inesperado. Revisa la consola.`,
            variant: "destructive",
          });
      }
    }

    setIsPushing(false);

    if (successCount > 0 && errorCount === 0) {
      toast({
        title: "¡Envío Exitoso!",
        description: `${successCount} caso(s) de prueba enviado(s) a Azure DevOps y enlazado(s) al PBI ${pbiId}.`,
        action: <CheckCircle className="text-green-500" />,
      });
    } else if (successCount > 0 && errorCount > 0) {
       toast({
        title: "Éxito Parcial",
        description: `${successCount} caso(s) de prueba enviado(s). ${errorCount} fallaron. Revisa la consola.`,
        variant: "default",
      });
    } else if (errorCount > 0 && successCount === 0) {
      toast({
        title: "Envío Fallido",
        description: `Todos los ${errorCount} caso(s) de prueba fallaron al enviar. Revisa la consola.`,
        variant: "destructive",
      });
    }
  };
  
  const isConfigMissing = !devOpsConfig.pat || !devOpsConfig.organization || !devOpsConfig.project;

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListChecks className="h-6 w-6 text-primary" />
          <CardTitle className="font-headline">Casos de Prueba Generados</CardTitle>
        </div>
        <CardDescription>
          Revisa los casos de prueba generados. Ingresa el ID del PBI y envíalos a Azure DevOps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {testCases.map((tc, index) => (
          <Card key={index} className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg font-semibold font-body">{tc.title}</CardTitle>
              {tc.description && <CardDescription className="pt-1">{tc.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Paso Nº</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Resultado Esperado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tc.steps && tc.steps.map((step, stepIndex) => (
                    <TableRow key={stepIndex}>
                      <TableCell className="font-medium text-center">{stepIndex + 1}</TableCell>
                      <TableCell className="whitespace-pre-line">{step.action}</TableCell>
                      <TableCell className="whitespace-pre-line">{step.expectedResult}</TableCell>
                    </TableRow>
                  ))}
                  {(!tc.steps || tc.steps.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">No hay pasos detallados para este caso de prueba.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </CardContent>
      <CardFooter className="flex flex-col gap-4 pt-6">
        <div className="w-full space-y-2">
            <Label htmlFor="pbiId" className="font-medium">Product Backlog Item ID</Label>
            <Input 
                id="pbiId" 
                placeholder="Ingresa ID de PBI (ej: 12345)" 
                value={pbiId} 
                onChange={(e) => setPbiId(e.target.value)}
                className="max-w-xs"
                disabled={isPushing}
            />
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 w-full">
            {isConfigLoaded && isConfigMissing && (
                <div className="flex items-center gap-2 text-sm text-amber-600 p-2 border border-amber-400 rounded-md bg-amber-50 w-full sm:w-auto">
                    <AlertTriangle className="h-5 w-5"/> 
                    <span>Configuración completa de Azure DevOps (PAT, Org, Proyecto) necesaria para enviar.</span>
                     <Link href="/configure" legacyBehavior passHref>
                        <Button variant="link" size="sm" className="p-0 h-auto text-amber-700 hover:text-amber-800">Configurar</Button>
                    </Link>
                </div>
            )}
            <Button 
              onClick={handlePushToDevOps} 
              className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto"
              disabled={!isConfigLoaded || isConfigMissing || isPushing || !pbiId.trim() || testCases.length === 0}
            >
              {isPushing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Enviar a Azure DevOps
                </>
              )}
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

