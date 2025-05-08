'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Loader2, ShieldAlert } from 'lucide-react'; // Added ShieldAlert
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context'; // Import useAuth to potentially trigger refresh manually if needed
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const loginFormSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter(); // Still needed potentially for other actions, but not for redirect on success
  const { refreshUserProfile } = useAuth(); // Get refresh function

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      // Profile fetching/syncing is handled by the onAuthStateChanged listener
      // in AuthContext via syncUserProfileOnLogin.
      // We can potentially trigger a manual refresh here if needed, but usually the listener is sufficient.
      // await refreshUserProfile(); // Optional: uncomment if listener proves unreliable

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${firebaseUser.email}! Redirecting...`,
      });

      // REMOVED: router.push('/');
      // AuthProvider handles profile sync and state update. AuthGuard handles redirection based on the updated state.

    } catch (error: any) {
      console.error('Error logging in:', error);
      let errorMessage = 'Login failed. Please check your credentials.';
      // Firebase Auth error codes
      if (error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-credential' ||
          error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
         errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
         errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes("Failed to load user profile")) {
          // Keep the specific profile load error message
          errorMessage = error.message;
      }

      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl border border-border/30 bg-card">
       <CardHeader className="text-center space-y-2">
         {/* Logo and Title moved inside Header */}
        <div className="inline-block mb-2">
             <Link href="/" className="inline-block">
                <div className="flex items-center justify-center gap-2 p-1">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-10 w-10 text-primary" // Use text-primary
                    >
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                    <h1 className="text-3xl font-bold text-primary">
                        CampusConnect Pro
                    </h1>
                </div>
            </Link>
        </div>
        <CardTitle className="text-2xl font-semibold text-card-foreground">Admin & Staff Login</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your credentials to access the system.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pb-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-card-foreground">Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} className="bg-background text-base md:text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-card-foreground">Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="bg-background text-base md:text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <Button type="submit" disabled={isLoading} className="w-full text-base py-3">
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-5 w-5" />
              )}
              Sign In
            </Button>
          </CardContent>
        </form>
      </Form>
       <CardFooter className="flex-col items-start gap-4 pt-4 border-t">
            <Alert variant="default" className="border-primary/30">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary font-semibold">Account Information</AlertTitle>
              <AlertDescription className="text-xs space-y-1">
                  <p><strong className="font-medium">Super Admin:</strong> Manually create in Firebase Auth with UID <code className="text-xs bg-muted px-1 rounded">superadmin</code>. Profile created on first login.</p>
                  <p><strong className="font-medium">School Admins/Staff:</strong> Accounts are created via the 'Schools' or 'Users' page by an existing admin.</p>
              </AlertDescription>
            </Alert>
            <p className="text-xs text-muted-foreground text-center w-full">
             Need help? Contact your administrator.
            </p>
       </CardFooter>
    </Card>
  );
}
