"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  isFirestoreConfigured: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isFirebaseConfigured = !!auth;
  const isFirestoreConfigured = !!db;

  useEffect(() => {
    // If Firebase is not configured, we don't need to do anything.
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isFirebaseConfigured]);

  const showConfigurationErrorToast = () => {
     toast({
        variant: "destructive",
        title: "Configuración de Firebase Faltante",
        description: "Las credenciales de Firebase no están configuradas en el servidor. Contacta al administrador."
    });
  }

  const signInWithEmail = async (email: string, pass: string): Promise<boolean> => {
    if (!auth) {
      showConfigurationErrorToast();
      return false;
    }
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: "Inicio de Sesión Exitoso", description: "¡Bienvenido de nuevo!" });
      return true;
    } catch (error) {
      console.error("Error de inicio de sesión:", error);
      const authError = error as AuthError;
      let description = "Credenciales incorrectas. Por favor, inténtalo de nuevo.";
      
      switch (authError.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
              description = "Credenciales incorrectas. Por favor, verifica tu correo y contraseña.";
              break;
          case 'auth/invalid-email':
              description = "Por favor, ingresa una dirección de correo válida.";
              break;
          case 'auth/user-disabled':
              description = "Esta cuenta de usuario ha sido deshabilitada.";
              break;
          default:
              description = "Ocurrió un error inesperado al iniciar sesión.";
              break;
      }

      toast({
        variant: "destructive",
        title: "Fallo de Inicio de Sesión",
        description: description
      });
      return false;
    }
  };
  
  const signUpWithEmail = async (email: string, pass: string) => {
    if (!auth) {
      showConfigurationErrorToast();
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      toast({ title: "Cuenta Creada", description: "¡Bienvenido! Has iniciado sesión." });
    } catch (error) {
      console.error("Error de registro:", error);
      const authError = error as AuthError;
      let description = "No se pudo crear la cuenta. Por favor, inténtalo de nuevo.";

      switch (authError.code) {
        case 'auth/email-already-in-use':
          description = "Este correo electrónico ya está registrado.";
          break;
        case 'auth/invalid-email':
          description = "Por favor, ingresa una dirección de correo válida.";
          break;
        case 'auth/weak-password':
          description = "La contraseña debe tener al menos 6 caracteres.";
          break;
        default:
          description = "Ocurrió un error inesperado al registrarse.";
          break;
      }

      toast({
        variant: "destructive",
        title: "Fallo de Registro",
        description: description
      });
    }
  };

  const signOut = async () => {
    if (!auth) {
      showConfigurationErrorToast();
      return;
    }
    try {
      await firebaseSignOut(auth);
      setUser(null);
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
    } catch (error: any) {
      console.error("Error al cerrar sesión:", error);
       toast({
        variant: "destructive",
        title: "Fallo al Cerrar Sesión",
        description: error.message
      });
    }
  };

  const value = {
    user,
    loading,
    isFirebaseConfigured,
    isFirestoreConfigured,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
