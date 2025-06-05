"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiKey } from "@/hooks/useApiKey";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ListChecks, UploadCloud, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface TestCaseDisplayProps {
  testCases: string[];
}

export function TestCaseDisplay({ testCases }: TestCaseDisplayProps) {
  const { apiKey, isKeyLoaded } = useApiKey();
  const { toast } = useToast();

  const handlePushToDevOps = () => {
    if (!isKeyLoaded) {
        toast({
            title: "Loading API Key",
            description: "Please wait while we check your API key status.",
            variant: "default"
        });
        return;
    }

    if (!apiKey) {
      toast({
        title: "Azure DevOps API Key Missing",
        description: (
          <div className="flex flex-col gap-2">
            <p>Please configure your API key in settings to push test cases.</p>
            <Link href="/configure" legacyBehavior passHref>
              <Button variant="outline" size="sm">Go to Configuration</Button>
            </Link>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    // Simulate API call
    console.log("Simulating push to Azure DevOps with key:", apiKey);
    console.log("Test Cases:", testCases);
    toast({
      title: "Simulated Push Successful!",
      description: "Test cases have been (simulated) pushed to Azure DevOps.",
      action: <CheckCircle className="text-green-500" />,
    });
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListChecks className="h-6 w-6 text-primary" />
          <CardTitle className="font-headline">Generated Test Cases</CardTitle>
        </div>
        <CardDescription>
          Review the generated test cases below. You can then push them to Azure DevOps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {testCases.map((tc, index) => (
          <Card key={index} className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base font-medium font-body">Test Case {index + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line">{tc}</p>
            </CardContent>
          </Card>
        ))}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-6">
        {!apiKey && isKeyLoaded && (
            <div className="flex items-center gap-2 text-sm text-amber-600 p-2 border border-amber-400 rounded-md bg-amber-50 w-full sm:w-auto">
                <AlertTriangle className="h-5 w-5"/> 
                <span>API key not configured. Test cases cannot be pushed.</span>
            </div>
        )}
        <Button 
          onClick={handlePushToDevOps} 
          className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto"
          disabled={!isKeyLoaded}
        >
          <UploadCloud className="mr-2 h-4 w-4" />
          Push to Azure DevOps
        </Button>
      </CardFooter>
    </Card>
  );
}
