
"use client";

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { UserStoryForm } from '@/components/forms/UserStoryForm';
import { TestCaseDisplay } from '@/components/display/TestCaseDisplay';
import type { GenerateTestCasesOutput } from '@/ai/flows/generate-test-cases';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  const [testCasesOutput, setTestCasesOutput] = useState<GenerateTestCasesOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        <UserStoryForm 
          setTestCasesOutput={setTestCasesOutput} 
          setIsLoading={setIsLoading} 
          isLoading={isLoading} 
        />
        
        {(isLoading || (testCasesOutput && testCasesOutput.testCases && testCasesOutput.testCases.length > 0)) && <Separator className="my-8" />}

        {isLoading && (
          <div className="flex flex-col items-center justify-center text-center py-10 bg-card p-6 rounded-lg shadow-md">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-xl font-semibold text-primary font-headline">Generando Casos de Prueba</p>
            <p className="text-muted-foreground">Por favor espera mientras la IA crea tus casos de prueba...</p>
          </div>
        )}
        
        {testCasesOutput && testCasesOutput.testCases && testCasesOutput.testCases.length > 0 && !isLoading && (
          <TestCaseDisplay testCases={testCasesOutput.testCases} />
        )}
        
        {testCasesOutput && (!testCasesOutput.testCases || testCasesOutput.testCases.length === 0) && !isLoading && (
            <div className="text-center py-10 bg-card p-6 rounded-lg shadow-md">
                <p className="text-lg font-medium">No se Generaron Casos de Prueba</p>
                <p className="text-muted-foreground">La IA no pudo generar casos de prueba con la información proporcionada. Por favor, intenta refinar los detalles de tu historia de usuario, especialmente los criterios de aceptación, y vuelve a intentarlo.</p>
            </div>
        )}
      </div>
    </AppLayout>
  );
}
