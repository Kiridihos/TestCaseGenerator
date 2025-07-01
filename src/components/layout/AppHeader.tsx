
"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, TestTubeDiagonal, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from '@/lib/utils';

const UserNav = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
            <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function AppHeader() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  useEffect(() => {
    setNavigatingTo(null);
  }, [pathname]);

  const handleNavigation = (path: string) => {
    if (pathname !== path) {
      setNavigatingTo(path);
    }
  };

  const isNavigating = navigatingTo !== null;

  return (
    <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link 
          href="/dashboard" 
          className={cn(
            "flex items-center gap-2 text-xl font-headline font-semibold text-primary hover:text-primary/80 transition-colors",
            isNavigating && "pointer-events-none opacity-50"
            )}
          onClick={() => handleNavigation('/dashboard')}
          aria-disabled={isNavigating}
        >
          {navigatingTo === '/dashboard' ? (
             <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
             <TestTubeDiagonal className="h-7 w-7" />
          )}
          <span>Test Case Generator</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link 
            href="/configure" 
            onClick={() => handleNavigation('/configure')}
            className={cn(isNavigating && "pointer-events-none")}
            aria-disabled={isNavigating}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Configuración"
              disabled={isNavigating}
            >
              {navigatingTo === '/configure' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Settings className="h-5 w-5" />
              )}
            </Button>
          </Link>
          {loading ? (
            <Skeleton className="h-8 w-8 rounded-full" />
          ) : user ? (
            <UserNav />
          ) : null}
        </nav>
      </div>
    </header>
  );
}
