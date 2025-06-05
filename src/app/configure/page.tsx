
import AppLayout from '@/components/layout/AppLayout';
import { ConfigurationForm } from '@/components/forms/ConfigurationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function ConfigurePage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-8 flex justify-center items-start pt-10">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <ShieldCheck className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">Application Configuration</CardTitle>
            <CardDescription>
              Manage your Azure DevOps Personal Access Token (PAT), Organization, and Project for seamless integration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConfigurationForm />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
