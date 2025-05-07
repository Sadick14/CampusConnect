
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
// Removed user service imports as profile sync is handled by AuthContext

const loginFormSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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

      // Profile fetching/syncing is now handled by the onAuthStateChanged listener
      // in AuthContext via syncUserProfileOnLogin. We just need to log in here.

      toast({
        title: 'Login Initiated',
        description: `Welcome back, ${firebaseUser.email}! Verifying profile...`, // Give immediate feedback
      });

      // The AuthProvider will detect the auth change, fetch/sync the profile,
      // update the currentUser state, and AuthGuard will handle redirection.
      // We can optimistically push, or wait for AuthGuard. Pushing immediately might be slightly faster UI-wise.
      router.push('/'); // Redirect to dashboard

    } catch (error: any) {
      console.error('Error logging in:', error);
      let errorMessage = 'Login failed. Please try again.';
      // Firebase Auth error codes: https://firebase.google.com/docs/reference/js/v8/firebase.auth.Auth#error-codes_1
      if (error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-credential' || // Generic credential error
          error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
         errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
         errorMessage = 'Network error. Please check your connection and try again.';
      }
      // Note: Firestore offline errors during profile sync are handled in AuthContext now.

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
    <Card className="w-full max-w-md shadow-xl border border-border/30">
       <CardHeader className="text-center">
         {/* Logo and Title */}
        <div className="inline-block mb-4">
             <div className="flex items-center justify-center gap-2 p-2">
                 <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-10 w-10" // Slightly smaller
                >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                </svg>
                <h1 className="text-3xl font-bold text-primary">
                    CampusConnect Pro
                </h1>
            </div>
        </div>
        <CardTitle className="text-2xl font-semibold text-foreground">Login</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your credentials to access your account.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Sign In
            </Button>
          </CardContent>
        </form>
      </Form>
       {/* Optional: Add links for "Forgot Password?" or "Sign Up" */}
        <CardContent className="mt-0 pt-0 text-center text-sm">
          <p className="text-muted-foreground">
            Credentials required. Contact admin if needed.
          </p>
           {/* <Link href="/forgot-password" className="text-primary hover:underline">Forgot Password?</Link> */}
        </CardContent>
    </Card>
  );
}
