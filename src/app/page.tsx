"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/forms/LoginForm';
import { RegisterForm } from '@/components/forms/RegisterForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TestTubeDiagonal, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const { user, loading, isFirebaseConfigured } = useAuth();
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState(true);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const toggleView = () => setIsLoginView(!isLoginView);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <TestTubeDiagonal className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-3xl">
              {isLoginView ? 'Bienvenido de Nuevo' : 'Crea una Cuenta'}
            </CardTitle>
            <CardDescription>
              {isLoginView ? 'Inicia sesión para continuar al Generador de Casos de Prueba.' : 'Ingresa tus datos para comenzar.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isFirebaseConfigured && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Servicio de Autenticación No Disponible</AlertTitle>
                    <AlertDescription>
                        La configuración de Firebase no está completa. Por favor, contacta al administrador del sistema.
                    </AlertDescription>
                </Alert>
            )}
            {isLoginView ? <LoginForm /> : <RegisterForm />}
            <div className="mt-4 text-center text-sm">
              {isLoginView ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}{' '}
              <Button variant="link" className="p-0 h-auto" onClick={toggleView}>
                {isLoginView ? 'Regístrate' : 'Iniciar sesión'}
              </Button>
            </div>
          </CardContent>
        </Card>
        <footer className="py-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Test Case Generator. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  );
}
