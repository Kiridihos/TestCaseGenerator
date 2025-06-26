
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAzureDevOpsConfig } from "@/hooks/useApiKey";
import { useToast } from "@/hooks/use-toast";
import { generateTestCases, type GenerateTestCasesOutput } from "@/ai/flows/generate-test-cases";
import { Loader2, Search, AlertTriangle } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
  pbiId: z.string().regex(/^\d+$/, "PBI ID must be a number.").min(1, "PBI ID cannot be empty."),
});

type PbiIdFormValues = z.infer<typeof formSchema>;

interface PbiIdFormProps {
  setTestCasesOutput: (output: GenerateTestCasesOutput | null) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  setPbiIdForPush: (id: string) => void;
}

export function PbiIdForm({ setTestCasesOutput, setIsLoading, isLoading, setPbiIdForPush }: PbiIdFormProps) {
  const { toast } = useToast();
  const { config: devOpsConfig, isConfigLoaded } = useAzureDevOpsConfig();

  const form = useForm<PbiIdFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pbiId: "",
    },
  });

  async function fetchPbiDetails(pbiId: string) {
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
    const apiUrl = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${pbiId}?fields=${fields}&api-version=7.1-preview.3`;

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
        return {
            title: data.fields["System.Title"] || "",
            description: data.fields["System.Description"] ? data.fields["System.Description"].replace(/<[^>]*>?/gm, '') : "", // Strip HTML tags
            acceptanceCriteria: data.fields["Microsoft.VSTS.Common.AcceptanceCriteria"] ? data.fields["Microsoft.VSTS.Common.AcceptanceCriteria"].replace(/<[^>]*>?/gm, '') : "",
        };
    } catch (error) {
        console.error("Error fetching PBI details:", error);
        toast({
            variant: "destructive",
            title: "Error al Obtener PBI",
            description: `No se pudo obtener el PBI ${pbiId}. Verifica el ID y tu configuración.`,
        });
        return null;
    }
  }

  async function onSubmit(values: PbiIdFormValues) {
    setIsLoading(true);
    setTestCasesOutput(null);
    setPbiIdForPush("");

    toast({ title: "Obteniendo PBI de Azure DevOps...", description: `Buscando PBI con ID: ${values.pbiId}` });
    const pbiDetails = await fetchPbiDetails(values.pbiId);

    if (!pbiDetails) {
      setIsLoading(false);
      return;
    }

    if (!pbiDetails.acceptanceCriteria) {
        toast({
            variant: "destructive",
            title: "Faltan Criterios de Aceptación",
            description: `El PBI ${values.pbiId} no tiene Criterios de Aceptación. No se pueden generar casos de prueba.`,
        });
        setIsLoading(false);
        return;
    }

    toast({ title: "PBI Obtenido", description: "Generando casos de prueba con la información del PBI." });

    try {
      const result = await generateTestCases(pbiDetails);
      setTestCasesOutput(result);
      setPbiIdForPush(values.pbiId);

      if (result.testCases.length === 0) {
        toast({
          title: "Generación Completa",
          description: "No se generaron casos de prueba. Intenta refinar los criterios de aceptación en Azure DevOps.",
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
        title: "Error",
        description: "Falló la generación de casos de prueba. Por favor intenta de nuevo.",
      });
      setTestCasesOutput(null);
    } finally {
      setIsLoading(false);
    }
  }

  const isConfigMissing = !devOpsConfig.pat || !devOpsConfig.organization || !devOpsConfig.project;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="pbiId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Backlog Item ID</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa el ID del PBI" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isConfigLoaded && isConfigMissing && (
            <div className="flex items-center gap-2 text-sm text-amber-600 p-2 border border-amber-400 rounded-md bg-amber-50 w-full">
                <AlertTriangle className="h-5 w-5"/>
                <span>Necesitas configurar tu PAT, Organización y Proyecto para usar esta función.</span>
                <Link href="/configure" legacyBehavior passHref>
                    <Button variant="link" size="sm" className="p-0 h-auto text-amber-700 hover:text-amber-800">Configurar</Button>
                </Link>
            </div>
        )}
        <Button type="submit" disabled={isLoading || isConfigMissing} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Obteniendo y Generando...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Obtener PBI y Generar Casos de Prueba
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
