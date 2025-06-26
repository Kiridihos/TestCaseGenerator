
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { UserStoryForm } from '@/components/forms/UserStoryForm';
import { PbiIdForm, type PbiDetails } from '@/components/forms/PbiIdForm';
import { TestCaseDisplay } from '@/components/display/TestCaseDisplay';
import { generateTestCases, type GenerateTestCasesInput, type GenerateTestCasesOutput } from '@/ai/flows/generate-test-cases';
import { useAzureDevOpsConfig } from "@/hooks/useApiKey";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Download } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [testCasesOutput, setTestCasesOutput] = useState<GenerateTestCasesOutput | null>(null);
  const [pbiIdForPush, setPbiIdForPush] = useState<string>("");
  const [fetchedPbiData, setFetchedPbiData] = useState<PbiDetails | null>(null);
  
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [isPbiLoading, setIsPbiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'pbi'>('manual');
  const [generationMode, setGenerationMode] = useState<'manual' | 'pbi' | null>(null);
  
  const [manualFormValues, setManualFormValues] = useState<GenerateTestCasesInput>({ title: '', description: '', acceptanceCriteria: '' });

  const { toast } = useToast();
  const { config: devOpsConfig, isConfigLoaded } = useAzureDevOpsConfig();
  const isConfigMissing = !isConfigLoaded || !devOpsConfig.pat || !devOpsConfig.organization || !devOpsConfig.project;
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const handleManualGenerate = async (values: GenerateTestCasesInput) => {
    setIsManualLoading(true);
    setTestCasesOutput(null);
    setFetchedPbiData(null);
    setPbiIdForPush("");
    setGenerationMode('manual');

    try {
      const result = await generateTestCases(values);
      setTestCasesOutput(result);
      if (result.testCases.length === 0) {
        toast({
          title: "Generation Complete",
          description: "No test cases were generated. Try refining your input.",
        });
      } else {
        toast({
          title: "Success!",
          description: "Test cases generated successfully.",
        });
      }
    } catch (error) {
      console.error("Error generating test cases:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate test cases. Please try again.",
      });
      setTestCasesOutput(null);
      setGenerationMode(null);
    } finally {
      setIsManualLoading(false);
    }
  };
  
  const fetchPbiDetails = async (id: string): Promise<PbiDetails | null> => {
    if (!devOpsConfig.pat || !devOpsConfig.organization || !devOpsConfig.project) {
        toast({
            title: "Configuración de Azure DevOps Incompleta",
            description: "Por favor configura tu PAT, Organización y Proyecto en ajustes.",
            variant: "destructive",
        });
        return null;
    }
    
    const { pat, organization, project } = devOpsConfig;
    const fields = "System.Title,System.Description,Microsoft.VSTS.Common.AcceptanceCriteria";
    const apiUrl = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${id}?fields=${fields}&api-version=7.1-preview.3`;

    try {
        const response = await fetch(apiUrl, {
            headers: {
                "Authorization": `Basic ${btoa(":" + pat)}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.statusText}`);
        }

        const data = await response.json();
        
        const getTextFromRichField = (html: string | undefined): string => {
            if (typeof window === 'undefined' || !html) return "";
            // Replace non-breaking spaces with regular spaces
            const sanitizedHtml = html.replace(/&nbsp;/g, ' ');
            const parser = new DOMParser();
            const doc = parser.parseFromString(sanitizedHtml, 'text/html');
            return doc.body.textContent || "";
        };

        const acceptanceCriteria = getTextFromRichField(data.fields["Microsoft.VSTS.Common.AcceptanceCriteria"]);
        const description = getTextFromRichField(data.fields["System.Description"]);
        
        const details: PbiDetails = {
            title: data.fields["System.Title"] || "",
            description: description,
            acceptanceCriteria: acceptanceCriteria
        };

        if (!details.acceptanceCriteria) {
            toast({
                variant: "destructive",
                title: "Faltan Criterios de Aceptación",
                description: `El PBI ${id} no tiene Criterios de Aceptación definidos.`,
            });
            return null;
        }
        return details;

    } catch (error: any) {
        console.error("Error fetching PBI details:", error);
        toast({
            variant: "destructive",
            title: "Error al Obtener PBI",
            description: `No se pudo obtener el PBI ${id}. Verifica el ID, tu configuración y la consola. ${error.message}`,
        });
        return null;
    }
  }

  const handlePbiFetch = async (pbiId: string) => {
    setIsPbiLoading(true);
    setTestCasesOutput(null);
    setFetchedPbiData(null);
    setPbiIdForPush("");
    setGenerationMode(null);

    toast({ title: "Obteniendo PBI de Azure DevOps...", description: `Buscando PBI con ID: ${pbiId}` });
    const pbiDetails = await fetchPbiDetails(pbiId);

    if (pbiDetails) {
        setFetchedPbiData(pbiDetails);
        setPbiIdForPush(pbiId);
        toast({
          title: "PBI Obtenido Correctamente",
          description: "Revisa la información. Haz clic en 'Editar' para modificarla antes de generar los casos de prueba."
        })
    }
    setIsPbiLoading(false);
  }

  const handlePbiGenerate = async () => {
    if (!fetchedPbiData) return;

    setIsPbiLoading(true);
    setTestCasesOutput(null);
    setGenerationMode('pbi');
    
    toast({ title: "Generando Casos de Prueba...", description: "La IA está trabajando. Por favor espera." });

    try {
      const result = await generateTestCases(fetchedPbiData);
      setTestCasesOutput(result);
      if (result.testCases.length === 0) {
        toast({
          title: "Generación Completa",
          description: "No se generaron casos de prueba. Revisa los criterios de aceptación en Azure DevOps.",
        });
      } else {
        toast({
          title: "¡Éxito!",
          description: "Casos de prueba generados exitosamente a partir del PBI.",
        });
      }
    } catch (error) {
      console.error("Error generating test cases:", error);
      toast({
        variant: "destructive",
        title: "Error de Generación",
        description: "Falló la generación de casos de prueba. Por favor intenta de nuevo.",
      });
      setTestCasesOutput(null);
      setGenerationMode(null);
    } finally {
      setIsPbiLoading(false);
    }
  }

  const handlePbiReset = () => {
    setFetchedPbiData(null);
    setPbiIdForPush("");
    setTestCasesOutput(null);
    setGenerationMode(null);
  }

  const isLoading = isManualLoading || isPbiLoading;

  const showResults = !isLoading && 
                      generationMode === activeTab && 
                      testCasesOutput && 
                      testCasesOutput.testCases && 
                      testCasesOutput.testCases.length > 0;

  const showNoResultsMessage = !isLoading &&
                               generationMode === activeTab &&
                               testCasesOutput &&
                               (!testCasesOutput.testCases || testCasesOutput.testCases.length === 0);

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        <Card className="w-full shadow-xl">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    Generador de Casos de Prueba
                </CardTitle>
                <CardDescription>
                    Selecciona un método para generar casos de prueba. Puedes ingresar los detalles manualmente o obtenerlos directamente desde un PBI en Azure DevOps.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="manual" className="w-full" onValueChange={(value) => setActiveTab(value as 'manual' | 'pbi')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual">
                            <FileText className="mr-2 h-4 w-4" />
                            Ingreso Manual
                        </TabsTrigger>
                        <TabsTrigger value="pbi">
                            <Download className="mr-2 h-4 w-4" />
                            Desde Azure DevOps
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="manual" className="pt-6">
                        <UserStoryForm 
                            onGenerate={handleManualGenerate} 
                            isLoading={isManualLoading}
                            values={manualFormValues}
                            onValuesChange={setManualFormValues}
                        />
                    </TabsContent>
                    <TabsContent value="pbi" className="pt-6">
                        <PbiIdForm
                            isLoading={isPbiLoading}
                            isConfigMissing={isConfigMissing}
                            fetchedData={fetchedPbiData}
                            onDataChange={setFetchedPbiData}
                            onFetch={handlePbiFetch}
                            onGenerate={handlePbiGenerate}
                            onReset={handlePbiReset}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
        
        {(isLoading || showResults || showNoResultsMessage) && <Separator className="my-8" />}

        {isLoading && (
          <div className="flex flex-col items-center justify-center text-center py-10 bg-card p-6 rounded-lg shadow-md">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-xl font-semibold text-primary font-headline">Procesando Solicitud</p>
            <p className="text-muted-foreground">Por favor espera un momento...</p>
          </div>
        )}
        
        {showResults && (
          <TestCaseDisplay 
            testCases={testCasesOutput.testCases} 
            initialPbiId={pbiIdForPush}
          />
        )}
        
        {showNoResultsMessage && (
            <div className="text-center py-10 bg-card p-6 rounded-lg shadow-md">
                <p className="text-lg font-medium">No se Generaron Casos de Prueba</p>
                <p className="text-muted-foreground">La IA no pudo generar casos de prueba con la información proporcionada. Por favor, intenta refinar los detalles y vuelve a intentarlo.</p>
            </div>
        )}
      </div>
    </AppLayout>
  );
}
