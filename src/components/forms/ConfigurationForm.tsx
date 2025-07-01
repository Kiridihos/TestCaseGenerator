
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAzureDevOpsConfig, type AzureDevOpsConfig } from "@/hooks/useApiKey";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { KeyRound, CheckCircle, Building, FolderGit2, Loader2 } from "lucide-react";

const formSchema = z.object({
  pat: z.string().min(1, { message: "El Personal Access Token es obligatorio." }),
  organization: z.string().min(1, { message: "La Organización es obligatoria." }),
  project: z.string().min(1, { message: "El Proyecto es obligatorio." }),
});


type ConfigurationFormValues = z.infer<typeof formSchema>;

export function ConfigurationForm() {
  const { config, saveAzureDevOpsConfig, clearAzureDevOpsConfig, isConfigLoaded } = useAzureDevOpsConfig();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ConfigurationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pat: "",
      organization: "",
      project: "",
    },
    mode: "onChange" 
  });

  useEffect(() => {
    if (isConfigLoaded) {
      form.reset({
        pat: config.pat || "",
        organization: config.organization || "",
        project: config.project || "",
      });
    }
  }, [config, form, isConfigLoaded]);

  async function onSubmit(values: ConfigurationFormValues) {
    setIsSaving(true);
    try {
        const newConfig: AzureDevOpsConfig = {
            pat: values.pat,
            organization: values.organization,
            project: values.project,
        };
        await saveAzureDevOpsConfig(newConfig);
        
        toast({
          title: "Configuration Saved",
          description: "Your Azure DevOps configuration has been saved to your account.",
          action: <CheckCircle className="text-green-500" />,
        });
    } catch (error) {
        console.error("Failed to save configuration:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save your configuration. Please try again.",
        });
    } finally {
        setIsSaving(false);
    }
  }

  async function handleClearConfig() {
    setIsSaving(true);
    try {
        await clearAzureDevOpsConfig();
        form.reset({ pat: "", organization: "", project: "" });
        toast({
            title: "Configuration Cleared",
            description: "Your Azure DevOps configuration has been cleared.",
        });
    } catch (error) {
        console.error("Failed to clear configuration:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not clear your configuration. Please try again.",
        });
    } finally {
        setIsSaving(false);
    }
  }

  if (!isConfigLoaded) {
    return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4">Loading your configuration...</p>
        </div>
    );
  }
  
  const isConfigPresent = !!(config.pat || config.organization || config.project);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="pat"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" /> Azure DevOps Personal Access Token (PAT)
              </FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your Azure DevOps PAT" {...field} value={field.value || ""} disabled={isSaving}/>
              </FormControl>
              <FormDescription>
                This token will be stored securely with your account. Ensure it has Work Item read/write permissions.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="organization"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" /> Azure DevOps Organization
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter your Azure DevOps Organization name" {...field} value={field.value || ""} disabled={isSaving}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="project"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-primary" /> Azure DevOps Project
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter your Azure DevOps Project name" {...field} value={field.value || ""} disabled={isSaving}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : "Save Configuration"}
            </Button>
            {isConfigPresent && (
                <Button type="button" variant="outline" onClick={handleClearConfig} className="w-full sm:w-auto" disabled={isSaving}>
                     {isSaving ? <Loader2 className="animate-spin" /> : "Clear Configuration"}
                </Button>
            )}
        </div>
      </form>
    </Form>
  );
}
