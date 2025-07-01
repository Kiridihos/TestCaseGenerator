
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
import { useEffect } from "react";
import { KeyRound, CheckCircle, Building, FolderGit2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  pat: z.string().min(1, "Personal Access Token (PAT) cannot be empty."),
  organization: z.string().min(1, "Organization name cannot be empty."),
  project: z.string().min(1, "Project name cannot be empty."),
});

type ConfigurationFormValues = z.infer<typeof formSchema>;

export function ConfigurationForm() {
  const { config, saveAzureDevOpsConfig, clearAzureDevOpsConfig, isConfigLoaded, isFromEnv } = useAzureDevOpsConfig();
  const { toast } = useToast();

  const form = useForm<ConfigurationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pat: "",
      organization: "",
      project: "",
    },
  });

  useEffect(() => {
    if (isConfigLoaded && (config.pat || config.organization || config.project)) {
      form.setValue("pat", config.pat || "");
      form.setValue("organization", config.organization || "");
      form.setValue("project", config.project || "");
    }
  }, [config, form, isConfigLoaded]);

  function onSubmit(values: ConfigurationFormValues) {
    if (isFromEnv) return;

    const newConfig: AzureDevOpsConfig = {
        pat: values.pat,
        organization: values.organization,
        project: values.project,
    };
    saveAzureDevOpsConfig(newConfig);
    toast({
      title: "Configuration Saved",
      description: "Your Azure DevOps configuration has been saved successfully.",
      action: <CheckCircle className="text-green-500" />,
    });
  }

  function handleClearConfig() {
    if (isFromEnv) return;

    clearAzureDevOpsConfig();
    form.reset({ pat: "", organization: "", project: "" });
    toast({
        title: "Configuration Cleared",
        description: "Your Azure DevOps configuration has been cleared.",
    });
  }

  if (!isConfigLoaded) {
    return <p>Loading configuration...</p>;
  }

  if (isFromEnv) {
      return (
          <div className="space-y-8">
              <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Configuration Managed Centrally</AlertTitle>
                  <AlertDescription>
                      The Azure DevOps connection details are configured via environment variables for all users. These settings cannot be changed here.
                  </AlertDescription>
              </Alert>
              <div className="space-y-4">
                  <div>
                      <Label className="flex items-center gap-2 mb-2"><Building className="h-5 w-5 text-primary" /> Organization</Label>
                      <Input readOnly value={config.organization || "Not set"} />
                  </div>
                   <div>
                      <Label className="flex items-center gap-2 mb-2"><FolderGit2 className="h-5 w-5 text-primary" /> Project</Label>
                      <Input readOnly value={config.project || "Not set"} />
                  </div>
                  <div>
                      <Label className="flex items-center gap-2 mb-2"><KeyRound className="h-5 w-5 text-primary" /> Personal Access Token (PAT)</Label>
                      <Input readOnly type="password" value={config.pat ? "••••••••••••••••" : "Not set"} />
                  </div>
              </div>
          </div>
      )
  }

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
                <Input type="password" placeholder="Enter your Azure DevOps PAT" {...field} />
              </FormControl>
              <FormDescription>
                This token will be stored locally in your browser. Ensure it has Work Item read/write permissions.
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
                <Input placeholder="Enter your Azure DevOps Organization name" {...field} />
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
                <Input placeholder="Enter your Azure DevOps Project name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" className="w-full sm:w-auto">Save Configuration</Button>
            {(!isFromEnv && (config.pat || config.organization || config.project)) && (
                <Button type="button" variant="outline" onClick={handleClearConfig} className="w-full sm:w-auto">
                    Clear Configuration
                </Button>
            )}
        </div>
      </form>
    </Form>
  );
}
