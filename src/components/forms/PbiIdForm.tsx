
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAzureDevOpsConfig } from "@/hooks/useApiKey";
import { useToast } from "@/hooks/use-toast";
import { generateTestCases, type GenerateTestCasesOutput } from "@/ai/flows/generate-test-cases";
import { Loader2, Search, AlertTriangle, Wand2, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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

interface PbiDetails {
    title: string;
    description: string;
    acceptanceCriteria: string;
}

export function PbiIdForm({ setTestCasesOutput, setIsLoading, isLoading, setPbiIdForPush }: PbiIdFormProps) {
  const { toast } = useToast();
  const { config: devOpsConfig, isConfigLoaded } = useAzureDevOpsConfig();
  const [fetchedData, setFetchedData] = useState<PbiDetails | null>(null);
  const [pbiId, setPbiId] = useState("");

  const form = useForm<PbiIdFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pbiId: "",
    },
  });

  const handleFetchedDataChange = (field: keyof PbiDetails, value: string) => {
    setFetchedData(prev => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  async function fetchPbiDetails(id: string): Promise<PbiDetails | null> {
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
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
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

    } catch (error) {
        console.error("Error fetching PBI details:", error);
        toast({
            variant: "destructive",
            title: "Error al Obtener PBI",
            description: `No se pudo obtener el PBI ${id}. Verifica el ID y tu configuración.`,
        });
        return null;
    }
  }

  async function handleFetch(values: PbiIdFormValues) {
    setIsLoading(true);
    setTestCasesOutput(null);
    setPbiIdForPush("");
    setFetchedData(null);
    
    toast({ title: "Obteniendo PBI de Azure DevOps...", description: `Buscando PBI con ID: ${values.pbiId}` });
    const pbiDetails = await fetchPbiDetails(values.pbiId);

    if (pbiDetails) {
        setFetchedData(pbiDetails);
        setPbiId(values.pbiId);
        toast({
          title: "PBI Obtenido Correctamente",
          description: "Revisa y edita la información, luego genera los casos de prueba."
        })
    }
    setIsLoading(false);
  }

  async function handleGenerate() {
    if (!fetchedData) return;

    setIsLoading(true);
    setTestCasesOutput(null);
    
    toast({ title: "Generando Casos de Prueba...", description: "La IA está trabajando. Por favor espera." });

    try {
      const result = await generateTestCases(fetchedData);
      setTestCasesOutput(result);
      setPbiIdForPush(pbiId);

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
    } finally {
      setIsLoading(false);
    }
  }

    function handleReset() {
        setFetchedData(null);
        setPbiId("");
        setTestCasesOutput(null);
        form.reset();
    }

  const isConfigMissing = !devOpsConfig.pat || !devOpsConfig.organization || !devOpsConfig.project;

  if (fetchedData) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="pbiTitle" className="flex items-center gap-2 font-medium">
                  <Pencil className="h-4 w-4 text-primary"/>
                  Title
                </Label>
                <Input id="pbiTitle" value={fetchedData.title} onChange={(e) => handleFetchedDataChange('title', e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="pbiDesc" className="flex items-center gap-2 font-medium">
                  <Pencil className="h-4 w-4 text-primary"/>
                  Description
                </Label>
                <Textarea id="pbiDesc" value={fetchedData.description} onChange={(e) => handleFetchedDataChange('description', e.target.value)} rows={4} className="resize-y"/>
            </div>
            <div className="space-y-2">
                <Label htmlFor="pbiAc" className="flex items-center gap-2 font-medium">
                  <Pencil className="h-4 w-4 text-primary"/>
                  Acceptance Criteria
                </Label>
                <Textarea id="pbiAc" value={fetchedData.acceptanceCriteria} onChange={(e) => handleFetchedDataChange('acceptanceCriteria', e.target.value)} rows={8} className="resize-y"/>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button onClick={handleGenerate} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generar Casos de Prueba
                    </>
                )}
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={isLoading} className="w-full sm:w-auto">
                    Buscar otro PBI
                </Button>
            </div>
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFetch)} className="space-y-4">
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
              Obteniendo...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Obtener PBI
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
