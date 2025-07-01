
"use client";

import { useEffect } from "react";
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
import type { GenerateTestCasesInput } from "@/ai/flows/generate-test-cases";
import { Loader2, Pencil } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres.").max(100, "El título debe tener como máximo 100 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres.").max(1000, "La descripción debe tener como máximo 1000 caracteres."),
  acceptanceCriteria: z.string().min(10, "Los criterios de aceptación deben tener al menos 10 caracteres.").max(5000, "Los criterios de aceptación deben tener como máximo 5000 caracteres."),
});

type UserStoryFormValues = z.infer<typeof formSchema>;

interface UserStoryFormProps {
  onGenerate: (values: GenerateTestCasesInput) => void;
  isLoading: boolean;
  values: UserStoryFormValues;
  onValuesChange: (values: UserStoryFormValues) => void;
}

export function UserStoryForm({ onGenerate, isLoading, values, onValuesChange }: UserStoryFormProps) {
  const form = useForm<UserStoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: values,
  });

  // This effect syncs the form's internal state up to the parent component
  // by subscribing to form value changes. This is the recommended way to avoid
  // infinite loops caused by calling setState in a useEffect hook.
  useEffect(() => {
    const subscription = form.watch((value) => {
      onValuesChange(value as UserStoryFormValues);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onValuesChange]);


  function onSubmit(values: UserStoryFormValues) {
    onGenerate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                Título
              </FormLabel>
              <FormControl>
                <Input placeholder="Ingresa el título de la historia de usuario" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                Descripción
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe la historia de usuario..."
                  className="resize-y"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="acceptanceCriteria"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                Criterios de Aceptación
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Lista los criterios de aceptación..."
                  className="resize-y"
                  rows={8}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            "Generar Casos de Prueba"
          )}
        </Button>
      </form>
    </Form>
  );
}
