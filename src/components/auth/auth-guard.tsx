
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
    // IMPORTANT: Only redirect *after* loading is complete and we are certain there's no user.
    if (!loading && !currentUser) {
      console.log("[AuthGuard] Not loading and no user. Redirecting to login.");
      // Optional: Store intended path before redirecting
      // localStorage.setItem('redirectAfterLogin', pathname);
      router.push('/login');
    } else if (!loading && currentUser) {
       console.log("[AuthGuard] Not loading and user found. Access granted.");
       // Optional: Redirect away from login page if already logged in and trying to access /login
       // if (pathname === '/login') {
       //    console.log("[AuthGuard] User already logged in, redirecting from /login to /");
       //    router.push('/');
       // }
    } else {
        // Still loading or state is transitioning
        console.log(`[AuthGuard] Status: Loading=${loading}, CurrentUser=${!!currentUser}`);
    }
  }, [currentUser, loading, router, pathname]); // Dependencies are correct

  // Show loading indicator while the auth state is being determined.
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is finished AND there is a user, render the children.
  // This condition is crucial to prevent rendering protected content prematurely.
  if (!loading && currentUser) {
    // Do not render children if user is logged in but currently on the login page
    // This prevents flashing the dashboard before redirecting away from login
    // if (pathname === '/login') {
    //    return ( // Return loading state while redirecting from login
    //        <div className="flex h-screen items-center justify-center">
    //            <Loader2 className="h-12 w-12 animate-spin text-primary" />
    //            <p className="ml-2">Redirecting...</p>
    //        </div>
    //    );
    // }
    return <>{children}</>;
  }

  // If loading is finished and there's NO user, show a redirecting message
  // while the useEffect hook performs the redirect. Avoid rendering children.
  // Also handles the case where the user is logged out and trying to access a protected page.
  if (!loading && !currentUser && pathname !== '/login') { // Don't show redirecting message on the login page itself
       return (
         <div className="flex h-screen items-center justify-center">
           <Loader2 className="h-12 w-12 animate-spin text-primary" />
           <p className="ml-2">Redirecting to login...</p>
         </div>
       );
  }

   // If on the login page and not logged in, allow rendering the login page children
   if (!loading && !currentUser && pathname === '/login') {
       return <>{children}</>;
   }


  // Fallback case (should theoretically not be reached with the logic above)
  // Render null or a minimal loading state to prevent potential flashes of incorrect content.
  return (
     <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
     </div>
  );
}

