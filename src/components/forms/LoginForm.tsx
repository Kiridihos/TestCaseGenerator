
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const MicrosoftIcon = () => (
    <svg width="21" height="21" viewBox="0 0 21 21" className="mr-2 h-5 w-5">
      <path fill="#f25022" d="M1 1h9v9H1z"></path>
      <path fill="#00a4ef" d="M1 11h9v9H1z"></path>
      <path fill="#7fba00" d="M11 1h9v9h-9z"></path>
      <path fill="#ffb900" d="M11 11h9v9h-9z"></path>
    </svg>
  );

export function LoginForm() {
  const { signInWithMicrosoft } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithMicrosoft();
      // The redirect is handled by the AuthContext and page logic
    } catch (error) {
      // The error toast is handled within the signInWithMicrosoft function
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button
        type="button"
        disabled={isLoading}
        className="w-full bg-white text-black border border-gray-300 hover:bg-gray-50"
        onClick={handleSignIn}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing In...
          </>
        ) : (
          <>
            <MicrosoftIcon />
            Sign in with Microsoft
          </>
        )}
      </Button>
    </div>
  );
}
