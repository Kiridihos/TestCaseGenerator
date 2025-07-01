"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAzureDevOpsConfig, type AzureDevOpsConfig } from "@/hooks/useApiKey";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, KeyRound, Building, FolderGit2, Info, Trash, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  pat: z.string().trim().min(1, { message: "PAT is required." }),
  organization: z.string().trim().min(1, { message: "Organization is required." }),
  project: z.string().trim().min(1, { message: "Project is required." }),
});

type ConfigurationFormValues = z.infer<typeof formSchema>;

export function ConfigurationForm() {
  const { config, isConfigLoaded, saveAzureDevOpsConfig, clearAzureDevOpsConfig, isUsingDefaultConfig, loadAzureDevOpsConfig } = useAzureDevOpsConfig();
  const { isFirebaseConfigured } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const form = useForm<ConfigurationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: config,
  });

  useEffect(() => {
    if (isConfigLoaded) {
      form.reset(config);
    }
  }, [config, isConfigLoaded, form]);

  if (!isConfigLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading configuration...</p>
      </div>
    );
  }

  if (!isFirebaseConfigured) {
    return (
       <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Database Service Not Available</AlertTitle>
        <AlertDescription>
          Firebase is not configured, so personal settings cannot be saved. The app will rely on global defaults if available.
        </AlertDescription>
      </Alert>
    )
  }

  async function onSubmit(values: ConfigurationFormValues) {
    setIsSaving(true);
    const result = await saveAzureDevOpsConfig(values);
    if (result.success) {
      toast({
        title: "Configuration Saved",
        description: "Your personal Azure DevOps settings have been saved successfully.",
      });
      loadAzureDevOpsConfig(); // Refresh state
    } else {
      toast({
        variant: "destructive",
        title: "Error Saving",
        description: result.error || "Could not save configuration. Please try again.",
      });
    }
    setIsSaving(false);
  }

  async function handleClear() {
    setIsClearing(true);
    const result = await clearAzureDevOpsConfig();
     if (result.success) {
      toast({
        title: "Configuration Cleared",
        description: "Your personal settings have been removed. The app will now use the default configuration if available.",
      });
      loadAzureDevOpsConfig(); // Refresh state
    } else {
      toast({
        variant: "destructive",
        title: "Error Clearing",
        description: result.error || "Could not clear configuration. Please try again.",
      });
    }
    setIsClearing(false);
  }

  return (
    <div className="space-y-8">
      {isUsingDefaultConfig ? (
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertTitle>Using Global Default Configuration</AlertTitle>
          <AlertDescription>
            These settings are provided by the application administrator. You can save your own personal settings below to override them.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Using Personal Configuration</AlertTitle>
            <AlertDescription>
                These are your personal settings. They are stored securely and linked only to your account.
            </AlertDescription>
        </Alert>
      )}
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
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" disabled={isSaving || isClearing} className="w-full">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Personal Configuration"
              )}
            </Button>
            <Button
                type="button"
                variant="destructive"
                onClick={handleClear}
                disabled={isClearing || isSaving || isUsingDefaultConfig}
                className="w-full sm:w-auto"
            >
                {isClearing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Clearing...
                    </>
                ) : (
                    <>
                        <Trash className="mr-2 h-4 w-4" />
                        Clear & Use Default
                    </>
                )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
