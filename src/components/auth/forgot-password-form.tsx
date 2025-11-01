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
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address.'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const { toast } = useToast();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, values.email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });

      setSentEmail(values.email);
      setEmailSent(true);
      
      toast({
        title: 'Reset Email Sent',
        description: 'Check your inbox for password reset instructions.',
      });

    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      toast({
        title: 'Reset Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (emailSent) {
    return (
      <Card className="w-full shadow-xl border border-border/30 bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            Password reset instructions sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-500/30 bg-green-500/5">
            <Mail className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-500">Email Sent Successfully</AlertTitle>
            <AlertDescription className="text-sm">
              We've sent password reset instructions to:
              <div className="mt-2 font-mono text-sm bg-muted px-3 py-2 rounded">
                {sentEmail}
              </div>
              <p className="mt-3 text-muted-foreground">
                Click the link in the email to create a new password. The link will expire in 1 hour.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2 pt-2">
            <Button asChild className="w-full">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setEmailSent(false);
                setSentEmail('');
                form.reset();
              }} 
              className="w-full"
            >
              Send to Different Email
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground pt-4">
            <p>Didn't receive the email?</p>
            <p className="mt-1">Check your spam folder or try again in a few minutes.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl border border-border/30 bg-card">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl font-semibold text-card-foreground">
          Forgot Your Password?
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          No worries! Enter your email and we'll send you reset instructions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pb-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-card-foreground">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="email" 
                        placeholder="you@example.com" 
                        {...field} 
                        className="pl-10 bg-background text-base md:text-sm"
                        autoFocus
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full text-base py-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-5 w-5" />
                  Send Reset Link
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-center gap-3 pt-4 border-t">
        <Button asChild variant="ghost" className="w-full">
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary font-medium underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
