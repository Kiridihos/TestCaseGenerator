import type { ReactNode } from 'react';
import AppHeader from './AppHeader';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow">
        {children}
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} TestCaseGenerator by Diego Fino With AI. Todos los derechos reservados.
      </footer>
    </div>
  );
}
