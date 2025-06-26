
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
import { generateTestCases, type GenerateTestCasesInput, type GenerateTestCasesOutput } from "@/ai/flows/generate-test-cases";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title must be at most 100 characters."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(1000, "Description must be at most 1000 characters."),
  acceptanceCriteria: z.string().min(10, "Acceptance Criteria must be at least 10 characters.").max(5000, "Acceptance Criteria must be at most 5000 characters."),
});

type UserStoryFormValues = z.infer<typeof formSchema>;

interface UserStoryFormProps {
  setTestCasesOutput: (output: GenerateTestCasesOutput | null) => void;
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
  setPbiIdForPush: (id: string) => void;
}

export function UserStoryForm({ setTestCasesOutput, setIsLoading, isLoading, setPbiIdForPush }: UserStoryFormProps) {
  const { toast } = useToast();
  const form = useForm<UserStoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      acceptanceCriteria: "",
    },
  });

  async function onSubmit(values: UserStoryFormValues) {
    setIsLoading(true);
    setTestCasesOutput(null);
    setPbiIdForPush("");
    try {
      const input: GenerateTestCasesInput = {
        title: values.title,
        description: values.description,
        acceptanceCriteria: values.acceptanceCriteria,
      };
      const result = await generateTestCases(input);
      setTestCasesOutput(result);
      if (result.testCases.length === 0) {
        toast({
          title: "Generation Complete",
          description: "No test cases were generated. Try refining your input.",
        });
      } else {
        toast({
          title: "Success!",
          description: "Test cases generated successfully.",
        });
      }
    } catch (error) {
      console.error("Error generating test cases:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate test cases. Please try again.",
      });
      setTestCasesOutput(null);
    } finally {
      setIsLoading(false);
    }
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
                Title
              </FormLabel>
              <FormControl>
                <Input placeholder="Enter user story title" {...field} />
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
                Description
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the user story..."
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
                Acceptance Criteria
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List the acceptance criteria..."
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
              Generating...
            </>
          ) : (
            "Generate Test Cases"
          )}
        </Button>
      </form>
    </Form>
  );
}
