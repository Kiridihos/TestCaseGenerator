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
import { useApiKey } from "@/hooks/useApiKey";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { KeyRound, CheckCircle } from "lucide-react";

const formSchema = z.object({
  apiKey: z.string().min(1, "API Key cannot be empty."),
});

type ConfigurationFormValues = z.infer<typeof formSchema>;

export function ConfigurationForm() {
  const { apiKey, saveApiKey, clearApiKey, isKeyLoaded } = useApiKey();
  const { toast } = useToast();

  const form = useForm<ConfigurationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
    },
  });

  useEffect(() => {
    if (isKeyLoaded && apiKey) {
      form.setValue("apiKey", apiKey);
    }
  }, [apiKey, form, isKeyLoaded]);

  function onSubmit(values: ConfigurationFormValues) {
    saveApiKey(values.apiKey);
    toast({
      title: "API Key Saved",
      description: "Your Azure DevOps API Key has been saved successfully.",
      action: <CheckCircle className="text-green-500" />,
    });
  }

  function handleClearApiKey() {
    clearApiKey();
    form.reset({ apiKey: "" });
    toast({
        title: "API Key Cleared",
        description: "Your Azure DevOps API Key has been cleared.",
    });
  }

  if (!isKeyLoaded) {
    return <p>Loading configuration...</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" /> Azure DevOps API Key
              </FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your Azure DevOps API Key" {...field} />
              </FormControl>
              <FormDescription>
                This key will be stored locally in your browser.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" className="w-full sm:w-auto">Save API Key</Button>
            {apiKey && (
                <Button type="button" variant="outline" onClick={handleClearApiKey} className="w-full sm:w-auto">
                    Clear API Key
                </Button>
            )}
        </div>
      </form>
    </Form>
  );
}
