
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { ConfigurationForm } from '@/components/forms/ConfigurationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function ConfigurePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-8 flex justify-center items-start pt-10">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <ShieldCheck className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">Configuración de la Aplicación</CardTitle>
            <CardDescription>
              Gestiona tu configuración personal para la integración con Azure DevOps. Estos datos se guardan de forma segura.
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
