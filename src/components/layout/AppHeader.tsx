import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings, TestTubeDiagonal } from 'lucide-react';

export default function AppHeader() {
  return (
    <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-headline font-semibold text-primary hover:text-primary/80 transition-colors">
          <TestTubeDiagonal className="h-7 w-7" />
          <span>Test Case Generator</span>
        </Link>
        <nav>
          <Link href="/configure" legacyBehavior passHref>
            <Button variant="ghost" size="icon" aria-label="Configuration">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
