
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAzureDevOpsConfig } from "@/hooks/useApiKey";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ListChecks, UploadCloud, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";

interface TestCaseDisplayProps {
  testCases: string[];
}

export function TestCaseDisplay({ testCases }: TestCaseDisplayProps) {
  const { config: devOpsConfig, isConfigLoaded } = useAzureDevOpsConfig();
  const { toast } = useToast();
  const [pbiId, setPbiId] = useState("");
  const [isPushing, setIsPushing] = useState(false);

  const handlePushToDevOps = async () => {
    if (!isConfigLoaded) {
      toast({
        title: "Loading Configuration",
        description: "Please wait while we check your Azure DevOps configuration.",
        variant: "default"
      });
      return;
    }

    if (!devOpsConfig.pat || !devOpsConfig.organization || !devOpsConfig.project) {
      toast({
        title: "Azure DevOps Configuration Missing",
        description: (
          <div className="flex flex-col gap-2">
            <p>Please configure your PAT, Organization, and Project in settings to push test cases.</p>
            <Link href="/configure" legacyBehavior passHref>
              <Button variant="outline" size="sm">Go to Configuration</Button>
            </Link>
          </div>
        ),
        variant: "destructive",
      });
      return;
    }

    if (!pbiId.trim()) {
      toast({
        title: "PBI ID Missing",
        description: "Please enter the Product Backlog Item ID to associate test cases with.",
        variant: "destructive",
      });
      return;
    }

    setIsPushing(true);
    let successCount = 0;
    let errorCount = 0;

    const { pat, organization, project } = devOpsConfig;

    for (const [index, tc] of testCases.entries()) {
      const apiUrl = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/$Test Case?api-version=7.1-preview.3`;
      
      // Convert newlines to <br /> and wrap in <p> for ReproSteps
      const htmlReproSteps = `<p>${tc.replace(/\n/g, '<br />')}</p>`;

      const body = [
        {
          "op": "add",
          "path": "/fields/System.Title",
          "value": `Generated TC ${index + 1}: ${tc.substring(0, 80)}${tc.length > 80 ? '...' : ''}`
        },
        {
          "op": "add",
          "path": "/fields/Microsoft.VSTS.TCM.ReproSteps",
          "value": htmlReproSteps
        },
        {
          "op": "add",
          "path": "/relations/-",
          "value": {
            "rel": "System.LinkTypes.Hierarchy-Reverse", // Test Case is a child of the PBI
            "url": `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems/${pbiId}`,
            "attributes": {
              "name": "Parent"
            }
          }
        }
      ];

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json-patch+json",
            "Authorization": `Basic ${btoa(":" + pat!)}`
          },
          body: JSON.stringify(body)
        });

        if (response.ok) {
          // const result = await response.json();
          // console.log(`Test Case ${index + 1} created:`, result.id);
          successCount++;
        } else {
          const errorData = await response.json();
          console.error(`Failed to create Test Case ${index + 1}:`, response.status, errorData);
          errorCount++;
          toast({
            title: `Error Creating TC ${index + 1}`,
            description: `Azure DevOps API Error: ${errorData.message || response.statusText}. Check console for details.`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error(`Network or other error for Test Case ${index + 1}:`, error);
        errorCount++;
         toast({
            title: `Error Pushing TC ${index + 1}`,
            description: `An unexpected error occurred. Check console for details.`,
            variant: "destructive",
          });
      }
    }

    setIsPushing(false);

    if (successCount > 0 && errorCount === 0) {
      toast({
        title: "Push Successful!",
        description: `${successCount} test case(s) pushed to Azure DevOps and linked to PBI ${pbiId}.`,
        action: <CheckCircle className="text-green-500" />,
      });
    } else if (successCount > 0 && errorCount > 0) {
       toast({
        title: "Partial Success",
        description: `${successCount} test case(s) pushed. ${errorCount} failed. Check console for details.`,
        variant: "default", // Or a warning variant if you have one
      });
    } else if (errorCount > 0 && successCount === 0) {
      toast({
        title: "Push Failed",
        description: `All ${errorCount} test case(s) failed to push. Check console for details.`,
        variant: "destructive",
      });
    }
    // if successCount === 0 and errorCount === 0, it means no test cases were processed, which shouldn't happen if testCases has items.
  };
  
  const isConfigMissing = !devOpsConfig.pat || !devOpsConfig.organization || !devOpsConfig.project;

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListChecks className="h-6 w-6 text-primary" />
          <CardTitle className="font-headline">Generated Test Cases</CardTitle>
        </div>
        <CardDescription>
          Review the generated test cases. Enter the PBI ID and push them to Azure DevOps.
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
      <CardFooter className="flex flex-col gap-4 pt-6">
        <div className="w-full space-y-2">
            <Label htmlFor="pbiId" className="font-medium">Product Backlog Item ID</Label>
            <Input 
                id="pbiId" 
                placeholder="Enter PBI ID (e.g., 12345)" 
                value={pbiId} 
                onChange={(e) => setPbiId(e.target.value)}
                className="max-w-xs"
                disabled={isPushing}
            />
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 w-full">
            {isConfigLoaded && isConfigMissing && (
                <div className="flex items-center gap-2 text-sm text-amber-600 p-2 border border-amber-400 rounded-md bg-amber-50 w-full sm:w-auto">
                    <AlertTriangle className="h-5 w-5"/> 
                    <span>Full Azure DevOps configuration (PAT, Org, Project) needed to push.</span>
                     <Link href="/configure" legacyBehavior passHref>
                        <Button variant="link" size="sm" className="p-0 h-auto text-amber-700 hover:text-amber-800">Configure</Button>
                    </Link>
                </div>
            )}
            <Button 
              onClick={handlePushToDevOps} 
              className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto"
              disabled={!isConfigLoaded || isConfigMissing || isPushing || !pbiId.trim()}
            >
              {isPushing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Pushing...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Push to Azure DevOps
                </>
              )}
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
