'use client';

import type { ReactNode} from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log(`[AuthGuard] Path: ${pathname}, Loading: ${loading}, User: ${!!currentUser}`);

    if (!loading) {
      // User not authenticated and trying to access protected route
      if (!currentUser && pathname !== '/login') {
        console.log("[AuthGuard] Redirecting to login - no user");
        router.replace('/login');
      }
      // User authenticated but still on login page - redirect to dashboard
      else if (currentUser && pathname === '/login') {
        console.log("[AuthGuard] Redirecting to dashboard - user already logged in");
        router.replace('/dashboard');
      }
    }
  }, [currentUser, loading, router, pathname]);

  // Render loading state while authentication is being determined
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render anything while redirecting (prevents flash of content)
  if (!currentUser && pathname !== '/login') {
    return null;
  }

  if (currentUser && pathname === '/login') {
    return null;
  }

  // Render children when:
  // - User is authenticated and not on login page
  // - User is not authenticated and on login page
  return <>{children}</>;
}
