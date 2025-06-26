
"use client";

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { UserStoryForm } from '@/components/forms/UserStoryForm';
import { PbiIdForm } from '@/components/forms/PbiIdForm';
import { TestCaseDisplay } from '@/components/display/TestCaseDisplay';
import type { GenerateTestCasesOutput } from '@/ai/flows/generate-test-cases';
import { Loader2, FileText, Download } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function HomePage() {
  const [testCasesOutput, setTestCasesOutput] = useState<GenerateTestCasesOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pbiIdForPush, setPbiIdForPush] = useState<string>("");

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
                <Tabs defaultValue="manual" className="w-full">
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
                            setTestCasesOutput={setTestCasesOutput} 
                            setIsLoading={setIsLoading} 
                            isLoading={isLoading}
                            setPbiIdForPush={setPbiIdForPush} 
                        />
                    </TabsContent>
                    <TabsContent value="pbi" className="pt-6">
                        <PbiIdForm
                            setTestCasesOutput={setTestCasesOutput} 
                            setIsLoading={setIsLoading} 
                            isLoading={isLoading} 
                            setPbiIdForPush={setPbiIdForPush}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
        
        {(isLoading || (testCasesOutput && testCasesOutput.testCases && testCasesOutput.testCases.length > 0)) && <Separator className="my-8" />}

        {isLoading && (
          <div className="flex flex-col items-center justify-center text-center py-10 bg-card p-6 rounded-lg shadow-md">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-xl font-semibold text-primary font-headline">Procesando Solicitud</p>
            <p className="text-muted-foreground">Por favor espera un momento...</p>
          </div>
        )}
        
        {testCasesOutput && testCasesOutput.testCases && testCasesOutput.testCases.length > 0 && !isLoading && (
          <TestCaseDisplay 
            testCases={testCasesOutput.testCases} 
            initialPbiId={pbiIdForPush}
          />
        )}
        
        {testCasesOutput && (!testCasesOutput.testCases || testCasesOutput.testCases.length === 0) && !isLoading && (
            <div className="text-center py-10 bg-card p-6 rounded-lg shadow-md">
                <p className="text-lg font-medium">No se Generaron Casos de Prueba</p>
                <p className="text-muted-foreground">La IA no pudo generar casos de prueba con la información proporcionada. Por favor, intenta refinar los detalles y vuelve a intentarlo.</p>
            </div>
        )}
      </div>
    </AppLayout>
  );
}
