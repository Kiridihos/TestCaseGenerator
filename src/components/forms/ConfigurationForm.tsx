"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAzureDevOpsConfig, type AzureDevOpsConfig } from "@/hooks/useApiKey";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, KeyRound, Building, FolderGit2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Info } from "lucide-react";

const formSchema = z.object({
  pat: z.string().trim(),
  organization: z.string().trim(),
  project: z.string().trim(),
}).superRefine((data, ctx) => {
    const hasSomeInput = data.pat || data.organization || data.project;
    if (hasSomeInput) {
        if (!data.pat) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "PAT is required if providing any configuration.", path: ["pat"] });
        }
        if (!data.organization) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Organization is required if providing any configuration.", path: ["organization"] });
        }
        if (!data.project) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Project is required if providing any configuration.", path: ["project"] });
        }
    }
});

type ConfigurationFormValues = z.infer<typeof formSchema>;

export function ConfigurationForm() {
  const { config, isConfigLoaded, saveAzureDevOpsConfig } = useAzureDevOpsConfig();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ConfigurationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pat: '',
      organization: '',
      project: '',
    },
  });

  useEffect(() => {
    if (isConfigLoaded) {
      form.reset(config);
    }
  }, [config, isConfigLoaded, form]);

  async function onSubmit(values: ConfigurationFormValues) {
    setIsSaving(true);
    try {
      await saveAzureDevOpsConfig(values);
      toast({
        title: "Configuration Saved",
        description: "Your Azure DevOps settings have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast({
        variant: "destructive",
        title: "Error Saving",
        description: "Could not save configuration. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (!isConfigLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Azure DevOps Configuration</AlertTitle>
        <AlertDescription>
          Your settings are stored securely and linked to your account. You can clear your configuration by removing all text and saving.
        </AlertDescription>
      </Alert>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="pat"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" /> Personal Access Token (PAT)
                </FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter your PAT" {...field} />
                </FormControl>
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
                  <Building className="h-5 w-5 text-primary" /> Organization
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter your Azure DevOps organization" {...field} />
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
                  <FolderGit2 className="h-5 w-5 text-primary" /> Project
                </FormLabel>
                <FormControl>
                  <Input placeholder="Enter your Azure DevOps project name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
