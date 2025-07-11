
"use client";

import { useState, useEffect } from "react";
import type { TestCase } from "@/ai/flows/generate-test-cases";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAzureDevOpsConfig } from "@/hooks/useApiKey";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ListChecks, UploadCloud, AlertTriangle, Loader2, Pencil, Check } from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TestCaseDisplayProps {
  testCases: TestCase[];
  initialPbiId?: string;
}

export function TestCaseDisplay({ testCases, initialPbiId }: TestCaseDisplayProps) {
  const { config: devOpsConfig, isConfigLoaded } = useAzureDevOpsConfig();
  const { toast } = useToast();
  const [pbiId, setPbiId] = useState(initialPbiId || "");
  const [isPushing, setIsPushing] = useState(false);
  const [pushSucceeded, setPushSucceeded] = useState(false);
  const [editableTestCases, setEditableTestCases] = useState<TestCase[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Deep copy to avoid mutating props and reset push status
    setEditableTestCases(JSON.parse(JSON.stringify(testCases)));
    setPushSucceeded(false);
  }, [testCases]);

  useEffect(() => {
    setPbiId(initialPbiId || "");
  }, [initialPbiId]);
  
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    // If user starts editing, we should allow a new push.
    if (!isEditing) {
      setPushSucceeded(false);
    }
  }

  const handleTestCaseChange = (index: number, field: 'title' | 'description', value: string) => {
    const newTestCases = [...editableTestCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setEditableTestCases(newTestCases);
    setPushSucceeded(false);
  };

  const handleStepChange = (testCaseIndex: number, stepIndex: number, field: 'action' | 'expectedResult', value: string) => {
    const newTestCases = [...editableTestCases];
    const newSteps = [...newTestCases[testCaseIndex].steps];
    newSteps[stepIndex] = { ...newSteps[stepIndex], [field]: value };
    newTestCases[testCaseIndex].steps = newSteps;
    setEditableTestCases(newTestCases);
    setPushSucceeded(false);
  };

  const formatStepsToXml = (steps: Array<{ action: string; expectedResult: string }>): string => {
    if (!steps || steps.length === 0) {
      return '';
    }
    
    const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

    const stepElements = steps.map((step, index) => {
      const actionHtml = `<div>${(step.action || '').replace(/\n/g, '<br />')}</div>`;
      const expectedResultHtml = `<div>${(step.expectedResult || '').replace(/\n/g, '<br />')}</div>`;

      return `
        <step id="${index + 1}" type="ValidateStep">
          <parameterizedString isformatted="true">${escape(actionHtml)}</parameterizedString>
          <parameterizedString isformatted="true">${escape(expectedResultHtml)}</parameterizedString>
        </step>`;
    }).join('');

    return `<steps id="0" last="${steps.length}">${stepElements}</steps>`;
  };

  const executePush = async () => {
    setIsPushing(true);
    let successCount = 0;
    let errorCount = 0;

    const { pat, organization, project } = devOpsConfig;

    for (const tc of editableTestCases) {
      const apiUrl = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/$Test Case?api-version=7.1-preview.3`;
      
      const xmlSteps = formatStepsToXml(tc.steps);

      const body = [
        { "op": "add", "path": "/fields/System.Title", "value": tc.title },
        { "op": "add", "path": "/fields/System.Description", "value": tc.description ? tc.description.replace(/\n/g, '<br />') : "" },
        { "op": "add", "path": "/relations/-", "value": { "rel": "System.LinkTypes.Hierarchy-Reverse", "url": `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${pbiId}`, "attributes": { "name": "Parent" } } }
      ];

      if (xmlSteps) {
        body.push({ "op": "add", "path": "/fields/Microsoft.VSTS.TCM.Steps", "value": xmlSteps });
      }

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json-patch+json", "Authorization": `Basic ${btoa(":" + pat!)}` },
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
      toast({ title: "¡Envío Exitoso!", description: `${successCount} caso(s) de prueba enviado(s) a Azure DevOps y enlazado(s) al PBI ${pbiId}.`, action: <CheckCircle className="text-green-500" /> });
      setPushSucceeded(true);
    } else if (successCount > 0 && errorCount > 0) {
       toast({ title: "Éxito Parcial", description: `${successCount} caso(s) de prueba enviado(s). ${errorCount} fallaron. Revisa la consola.`, variant: "default" });
       setPushSucceeded(true); // Still consider it a success for the ones that went through
    } else if (errorCount > 0 && successCount === 0) {
      toast({ title: "Envío Fallido", description: `Todos los ${errorCount} caso(s) de prueba fallaron al enviar. Revisa la consola.`, variant: "destructive" });
    }
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

    // This is where the check happens. The `AlertDialog` will trigger `executePush` if confirmed.
    // If `pushSucceeded` is false, it will just call `executePush` directly.
    if (!pushSucceeded) {
        executePush();
    }
  };
  
  const isConfigMissing = !devOpsConfig.pat || !devOpsConfig.organization || !devOpsConfig.project;
  
  const readOnlyClasses = "read-only:bg-background read-only:border read-only:shadow-sm read-only:cursor-text read-only:ring-0 read-only:focus-visible:ring-0 read-only:focus-visible:ring-offset-0";

  const PushButton = (
    <Button 
        onClick={handlePushToDevOps} 
        className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto"
        disabled={!isConfigLoaded || isConfigMissing || isPushing || !pbiId.trim() || editableTestCases.length === 0}
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
  );

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline">Casos de Prueba Generados ({editableTestCases.length})</CardTitle>
            </div>
             <Button variant="outline" size="sm" onClick={handleEditToggle}>
                {isEditing ? <Check className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                {isEditing ? 'Finalizar Edición' : 'Editar'}
            </Button>
        </div>
        <CardDescription>
          {isEditing 
            ? "Modifica los detalles de los casos de prueba a continuación. Cualquier cambio te permitirá enviarlos de nuevo."
            : "Revisa los casos de prueba. Haz clic en 'Editar' para modificarlos."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {editableTestCases.map((tc, index) => (
          <Card key={index} className="bg-muted/30">
            <CardHeader className="space-y-4">
              <CardTitle className="text-xl font-semibold">Caso de Prueba {index + 1}</CardTitle>
              <div className="space-y-1.5">
                <Label htmlFor={`title-${index}`} className="font-semibold text-foreground">Título</Label>
                <Input 
                  id={`title-${index}`}
                  value={tc.title}
                  readOnly={!isEditing}
                  onChange={(e) => handleTestCaseChange(index, 'title', e.target.value)}
                  className={cn(
                    "w-full text-lg font-semibold read-only:bg-background read-only:border read-only:shadow-sm",
                    readOnlyClasses
                  )}
                  placeholder="Título del Caso de Prueba"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`description-${index}`} className="font-semibold text-foreground">Descripción</Label>
                <Textarea
                  id={`description-${index}`}
                  value={tc.description}
                  readOnly={!isEditing}
                  onChange={(e) => handleTestCaseChange(index, 'description', e.target.value)}
                  className={cn(
                    "w-full read-only:bg-background read-only:border read-only:shadow-sm",
                    isEditing ? "resize-y" : "resize-none",
                    readOnlyClasses
                  )}
                  placeholder="Descripción del Caso de Prueba"
                  rows={2}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] text-foreground font-semibold">Paso Nº</TableHead>
                    <TableHead className="text-foreground font-semibold">Acción</TableHead>
                    <TableHead className="text-foreground font-semibold">Resultado Esperado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tc.steps && tc.steps.map((step, stepIndex) => (
                    <TableRow key={stepIndex}>
                      <TableCell className="font-medium text-center">{stepIndex + 1}</TableCell>
                      <TableCell>
                        <Textarea 
                            value={step.action}
                            readOnly={!isEditing}
                            onChange={(e) => handleStepChange(index, stepIndex, 'action', e.target.value)}
                            className={cn(
                                "w-full read-only:bg-background read-only:border read-only:shadow-sm",
                                isEditing ? "resize-y" : "resize-none",
                                readOnlyClasses
                            )}
                            placeholder="Acción..."
                            rows={3}
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea 
                            value={step.expectedResult}
                            readOnly={!isEditing}
                            onChange={(e) => handleStepChange(index, stepIndex, 'expectedResult', e.target.value)}
                            className={cn(
                                "w-full read-only:bg-background read-only:border read-only:shadow-sm",
                                isEditing ? "resize-y" : "resize-none",
                                readOnlyClasses
                            )}
                            placeholder="Resultado esperado..."
                            rows={3}
                        />
                      </TableCell>
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
            <Label htmlFor="pbiId" className="font-medium">ID del Product Backlog Item</Label>
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
            
            {pushSucceeded ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  {PushButton}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmas reenviar los Casos de Prueba?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Estos casos de prueba ya fueron enviados exitosamente a Azure DevOps. Si continúas, se crearán como nuevos casos de prueba duplicados. ¿Estás seguro de que quieres hacerlo?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={executePush}>Sí, reenviar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              PushButton
            )}

        </div>
      </CardFooter>
    </Card>
  );
}

    