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
    console.log(`[AuthGuard Effect] Path: ${pathname}, Loading: ${loading}, User: ${!!currentUser}`);

    // If loading is finished
    if (!loading) {
      // And there's no user, and we are NOT on the login page
      if (!currentUser && pathname !== '/login') {
        console.log("[AuthGuard] Not loading, no user, not on /login. Redirecting to login.");
        router.replace('/login'); // Use replace to avoid adding login to history when redirecting
      }
      // And there IS a user, and we ARE on the login page
      else if (currentUser && pathname === '/login') {
        console.log("[AuthGuard] User logged in, but on /login page. Redirecting to /.");
        router.replace('/'); // Redirect away from login if already authenticated
      }
      // And there IS a user, and we are NOT on the login page (Access Granted)
      else if (currentUser && pathname !== '/login') {
         console.log("[AuthGuard] Access granted. User exists and not on login page.");
      }
       // And there's NO user, and we ARE on the login page (Allow Login Page)
      else if (!currentUser && pathname === '/login') {
         console.log("[AuthGuard] No user, on login page. Allowing login page render.");
      }
    }
     // Still loading, wait for auth state to resolve
     else {
         console.log("[AuthGuard] Still loading auth state...");
     }

  // Add pathname to dependencies to re-evaluate if the user navigates while still loading/logged out
  }, [currentUser, loading, router, pathname]);

  // --- Render Logic ---

  // Show loading indicator while the auth state is being determined.
  if (loading) {
    console.log("[AuthGuard Render] Showing loading indicator.");
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is finished AND there is NO user AND we are NOT on the login page, show redirecting message
  // This prevents rendering protected children while the redirect effect runs.
  if (!loading && !currentUser && pathname !== '/login') {
     console.log("[AuthGuard Render] Showing redirecting message (no user, not on /login).");
     return (
       <div className="flex h-screen items-center justify-center">
         <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <p className="ml-2">Redirecting to login...</p>
       </div>
     );
  }

   // If loading is finished AND there IS a user AND we are on the login page, show redirecting message
   // This prevents rendering the login page while the redirect effect runs.
   if (!loading && currentUser && pathname === '/login') {
       console.log("[AuthGuard Render] Showing redirecting message (user logged in, on /login).");
       return (
           <div className="flex h-screen items-center justify-center">
               <Loader2 className="h-12 w-12 animate-spin text-primary" />
               <p className="ml-2">Redirecting...</p>
           </div>
       );
   }


  // If loading is finished AND ( (user exists AND not on login page) OR (no user AND on login page) )
  // then render the children. This covers both authenticated access to protected routes
  // and unauthenticated access to the login page itself.
   if (!loading && ((currentUser && pathname !== '/login') || (!currentUser && pathname === '/login'))) {
     console.log("[AuthGuard Render] Rendering children.");
     return <>{children}</>;
   }

  // Fallback: Render loading state if none of the above conditions are met (should be rare).
  console.log("[AuthGuard Render] Fallback: Rendering loading indicator.");
  return (
     <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
     </div>
  );
}
