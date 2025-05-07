
'use client';

import type { ReactNode } from 'react';
import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { SidebarNav } from './sidebar-nav';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Moon, Sun, UserCircle, ChevronsUpDown, Loader2, Settings } from 'lucide-react'; // Added Settings icon
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast'; // Import useToast
import Link from 'next/link';


export function AppShell({ children }: { children: ReactNode }) {
  const { currentUser, loading: authLoading, logout } = useAuth();
  const [isDarkTheme, setIsDarkTheme] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false); // Add logging out state
  const { toast } = useToast(); // Get toast function

  React.useEffect(() => {
    // Check for saved theme preference or system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDarkTheme(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkTheme(false);
    }
  }, []);


  const clientToggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkTheme(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkTheme(true);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true); // Set loading state
    try {
        await logout();
        // Redirect is handled within logout function's finally block in AuthContext
        toast({ title: "Logged out successfully."});
    } catch (error) {
         console.error("Logout error:", error);
         toast({ title: "Logout Failed", description: "An error occurred during logout.", variant: "destructive"});
         setIsLoggingOut(false); // Reset loading state on error
    }
    // No finally block needed here as AuthContext handles redirect and its own loading state reset
  };
  
  const getUserInitials = (name?: string | null) => {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border shadow-lg">
        <SidebarHeader>
          {/* Display School Logo if available and user is school_admin/teacher/student */}
          {currentUser && currentUser.role !== 'superadmin' && currentUser.schoolLogoUrl ? (
             <div className="flex items-center gap-2 p-2">
               <img src={currentUser.schoolLogoUrl} alt={`${currentUser.schoolName || 'School'} Logo`} className="h-10 w-auto object-contain group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" />
               <h1 className="text-xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                  {currentUser.schoolName}
                </h1>
             </div>
          ) : (
            <Logo /> // Default app logo
          )}
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-2">
           <Button variant="ghost" onClick={clientToggleTheme} className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="group-data-[collapsible=icon]:hidden">Toggle Theme</span>
          </Button>
          {currentUser && (
            <Button 
              variant="ghost" 
              onClick={handleLogout} 
              disabled={isLoggingOut || authLoading} // Disable while logging out or initial auth loading
              className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              {isLoggingOut ? (
                 <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                 <LogOut className="h-4 w-4" />
              )}
              <span className="group-data-[collapsible=icon]:hidden">
                  {isLoggingOut ? "Logging out..." : "Logout"}
              </span>
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>
      <SidebarRail />
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* Placeholder for breadcrumbs or page title */}
             {/* Display School Name in header if not superadmin */}
             {currentUser && currentUser.role !== 'superadmin' && currentUser.schoolName && (
               <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">{currentUser.schoolName}</span>
             )}
          </div>
          <div className="flex items-center gap-4">
            {authLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 py-1 h-auto">
                     <Avatar className="h-7 w-7">
                        {/* Use school logo as avatar fallback if available */}
                        {currentUser.schoolLogoUrl && currentUser.role !== 'superadmin' ? (
                           <AvatarImage src={currentUser.schoolLogoUrl} alt="School Logo" className="object-contain"/>
                        ) : null }
                        <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.name || 'User'} /> {/* Display user photo if available */}
                        <AvatarFallback>{getUserInitials(currentUser.name)}</AvatarFallback>
                     </Avatar>
                    <span className="hidden sm:inline">{currentUser.name}</span>
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                   <Link href="/settings" passHref>
                      <DropdownMenuItem>
                         <Settings className="mr-2 h-4 w-4" />
                         <span>Settings</span>
                      </DropdownMenuItem>
                   </Link>
                   <DropdownMenuItem disabled>Profile (Soon)</DropdownMenuItem>
                   <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                    {isLoggingOut ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                    )}
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
               <Button variant="outline" size="sm" onClick={() => window.location.href = '/login'}>Login</Button>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
