
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
import { Loader2, Search, AlertTriangle, Wand2, Pencil, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  pbiId: z.string().regex(/^\d+$/, "El ID de PBI debe ser un número.").min(1, "El ID de PBI no puede estar vacío."),
});

type PbiIdFormValues = z.infer<typeof formSchema>;

export interface PbiDetails {
    title: string;
    description: string;
    acceptanceCriteria: string;
}

interface PbiIdFormProps {
  isLoading: boolean;
  isConfigMissing: boolean;
  fetchedData: PbiDetails | null;
  onFetch: (pbiId: string) => void;
  onGenerate: () => void;
  onReset: () => void;
  onDataChange: (data: PbiDetails) => void;
}

export function PbiIdForm({ isLoading, isConfigMissing, fetchedData, onFetch, onGenerate, onReset, onDataChange }: PbiIdFormProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<PbiIdFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pbiId: "",
    },
  });

  const handleFetchedDataChange = (field: keyof PbiDetails, value: string) => {
    if(fetchedData) {
      onDataChange({ ...fetchedData, [field]: value });
    }
  };

  function handleFetchSubmit(values: PbiIdFormValues) {
    onFetch(values.pbiId);
  }

  function handleReset() {
    setIsEditing(false);
    form.reset();
    onReset();
  }
  
  if (fetchedData) {
    return (
        <Card className="w-full shadow-lg border">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Información del PBI</CardTitle>
                        <CardDescription>
                            {isEditing 
                                ? "Modifica los detalles obtenidos de Azure DevOps." 
                                : "Revisa la información. Haz clic en 'Editar' para modificarla."}
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? <Check className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                        {isEditing ? 'Finalizar Edición' : 'Editar Datos'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="pbiTitle" className="font-semibold">Título</Label>
                    {isEditing ? (
                        <Input 
                            id="pbiTitle" 
                            value={fetchedData.title} 
                            onChange={(e) => handleFetchedDataChange('title', e.target.value)} 
                        />
                    ) : (
                        <p className="text-sm p-3 bg-muted/50 rounded-md border">{fetchedData.title || "N/A"}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="pbiDesc" className="font-semibold">Descripción</Label>
                    {isEditing ? (
                         <Textarea 
                            id="pbiDesc" 
                            value={fetchedData.description} 
                            onChange={(e) => handleFetchedDataChange('description', e.target.value)} 
                            rows={4} 
                            className="resize-y"
                        />
                    ) : (
                        <p className="text-sm p-3 bg-muted/50 rounded-md border whitespace-pre-wrap min-h-[60px]">{fetchedData.description || "N/A"}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="pbiAc" className="font-semibold">Criterios de Aceptación</Label>
                     {isEditing ? (
                        <Textarea 
                            id="pbiAc" 
                            value={fetchedData.acceptanceCriteria} 
                            onChange={(e) => handleFetchedDataChange('acceptanceCriteria', e.target.value)} 
                            rows={8} 
                            className="resize-y"
                        />
                    ) : (
                        <p className="text-sm p-3 bg-muted/50 rounded-md border whitespace-pre-wrap min-h-[120px]">{fetchedData.acceptanceCriteria || "N/A"}</p>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2 pt-6 justify-between items-center">
                 <Button variant="outline" onClick={handleReset} disabled={isLoading} className="w-full sm:w-auto">
                    Buscar otro PBI
                </Button>
                <Button onClick={onGenerate} disabled={isLoading} className="w-full sm:w-auto">
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
            </CardFooter>
        </Card>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFetchSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="pbiId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID del Product Backlog Item</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa el ID del PBI" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isConfigMissing && (
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
