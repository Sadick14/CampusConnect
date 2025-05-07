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
import { createUserProfile, getUserProfile, User } from '@/services/user'; 
import { FirestoreError } from 'firebase/firestore';

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
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      // Attempt to get or create user profile
      let userProfile: User | null = null;
      try {
        userProfile = await getUserProfile(firebaseUser.uid);
        if (!userProfile) {
          console.log(`No profile found for UID ${firebaseUser.uid}, attempting to create...`);
          // Pass necessary info, createUserProfile determines role (e.g., superadmin based on email)
          userProfile = await createUserProfile(firebaseUser, {}); 
          console.log('Profile created:', userProfile);
        } else {
           // If profile exists, ensure role is updated if it's the superadmin logging in
           if (firebaseUser.email === 'superadmin@example.com' && userProfile.role !== 'superadmin') {
              console.log(`Updating role for ${firebaseUser.email} to superadmin.`);
              userProfile = await createUserProfile(firebaseUser, { role: 'superadmin' }); // This effectively updates the role via merge: true
           }
           console.log('Profile found:', userProfile);
        }
      } catch (profileError: any) {
          console.error('Error getting/creating user profile:', profileError);
           if (profileError instanceof Error && profileError.message.includes("offline")) {
                toast({
                    title: 'Login Partially Successful (Offline)',
                    description: "Logged in, but couldn't fetch your full profile as the app is offline. Some features might be limited.",
                    variant: 'default', // Or a custom 'warning' variant
                    duration: 5000,
                });
                 // Allow login even if profile fetch fails offline, but currentUser in context might be null/stale initially
                 router.push('/'); 
                 return; // Exit onSubmit early
            }
          // If profile creation/retrieval fails for other reasons, treat it as a login failure
          throw new Error(`Failed to load user profile: ${profileError.message}`);
      }

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userProfile?.name || firebaseUser.email}!`,
      });
      router.push('/'); // Redirect to dashboard after successful login and profile handling

    } catch (error: any) {
      console.error('Error logging in:', error);
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      } else if (error instanceof FirestoreError && error.message.includes("offline")) {
         // This case might be caught by the inner try/catch now, but keep as fallback
         errorMessage = "Login failed: Could not connect to the database. Please check your connection.";
      } else if (error.message.includes('Failed to load user profile')) {
          errorMessage = error.message; // Use the specific profile error
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
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl text-primary">
          <LogIn className="h-6 w-6" /> CampusConnect Pro Login
        </CardTitle>
        <CardDescription>
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
            Don&apos;t have an account? Contact admin.
          </p>
        </CardContent>
    </Card>
  );
}