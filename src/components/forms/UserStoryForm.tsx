
"use client";

import { useEffect, useRef } from "react";
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
  title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title must be at most 100 characters."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(1000, "Description must be at most 1000 characters."),
  acceptanceCriteria: z.string().min(10, "Acceptance Criteria must be at least 10 characters.").max(5000, "Acceptance Criteria must be at most 5000 characters."),
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

  const watchedValues = form.watch();
  const isMounted = useRef(false);

  useEffect(() => {
    // This effect syncs the form's internal state up to the parent component.
    // We use the isMounted ref to prevent this from running on the initial render,
    // which avoids a potential infinite loop if not handled carefully.
    if (isMounted.current) {
      onValuesChange(watchedValues);
    } else {
      isMounted.current = true;
    }
  }, [watchedValues, onValuesChange]);


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
