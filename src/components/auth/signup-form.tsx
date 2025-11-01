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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserPlus, Mail, Lock, User, Shield, GraduationCap, School, Users } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { updateUserRoleAfterSignup } from '@/services/user';

const signupFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.'),
  confirmPassword: z.string(),
  accountType: z.enum(['school_admin', 'teacher', 'student'], {
    required_error: 'Please select an account type.',
  }),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions.',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

const accountTypeOptions = [
  {
    value: 'school_admin',
    label: 'School Administrator',
    description: 'Manage your school, staff, and students',
    icon: School,
  },
  {
    value: 'teacher',
    label: 'Teacher',
    description: 'Manage classes, grades, and attendance',
    icon: GraduationCap,
  },
  {
    value: 'student',
    label: 'Student',
    description: 'Access your academic records',
    icon: Users,
  },
];

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      accountType: 'student',
      termsAccepted: false,
    },
  });

  async function onSubmit(values: SignupFormValues) {
    setIsLoading(true);
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      
      const firebaseUser = userCredential.user;

      // Update display name in Firebase Auth
      try {
        await updateProfile(firebaseUser, {
          displayName: values.name
        });
      } catch (updateError) {
        console.error('Error updating display name:', updateError);
      }

      // Update user role in Firestore
      try {
        await updateUserRoleAfterSignup(firebaseUser.uid, values.accountType, values.name);
      } catch (roleError) {
        console.error('Error updating user role:', roleError);
        // Continue anyway - the sync will happen on next login
      }

      // Send email verification
      try {
        await sendEmailVerification(firebaseUser);
        setVerificationEmailSent(true);
        
        toast({
          title: 'Account Created Successfully!',
          description: `Welcome, ${values.name}! Please check your email to verify your account.`,
        });
      } catch (verifyError) {
        console.error('Error sending verification email:', verifyError);
        toast({
          title: 'Account Created',
          description: 'Account created but verification email could not be sent. You can still proceed.',
        });
      }

      // Auth state change will automatically redirect via AuthGuard
      // No manual redirect needed - more seamless experience

    } catch (error: any) {
      console.error('Error creating account:', error);
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled. Please contact support.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      toast({
        title: 'Signup Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onGoogleSignUp() {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;

      // Check if email verification is needed
      if (!firebaseUser.emailVerified && firebaseUser.email) {
        // Google accounts are typically pre-verified, but we can track this
        console.log('Google user email verified:', firebaseUser.emailVerified);
      }

      toast({
        title: 'Account Created Successfully!',
        description: `Welcome, ${firebaseUser.displayName || firebaseUser.email}!`,
      });

      // Auth state change will automatically redirect via AuthGuard
      // No manual redirect needed

    } catch (error: any) {
      console.error('Error with Google sign-up:', error);
      let errorMessage = 'Google sign-up failed. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-up cancelled.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up blocked by browser. Please allow pop-ups and try again.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email using a different sign-in method. Please login instead.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          title: 'Sign-Up Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }

  if (verificationEmailSent) {
    return (
      <Card className="w-full shadow-xl border border-border/30 bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertTitle>Verification Email Sent</AlertTitle>
            <AlertDescription>
              Please check your inbox and click the verification link to activate your account.
              The page will automatically redirect you to the dashboard.
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={() => setVerificationEmailSent(false)} 
            className="w-full"
          >
            Back to Signup
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl border border-border/30 bg-card">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl font-semibold text-card-foreground">
          Create Your Account
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Get started with CampusConnect Pro
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pb-6">
        {/* Google Sign-Up Button - Quick Option */}
        <Button
          type="button"
          onClick={onGoogleSignUp}
          disabled={isGoogleLoading || isLoading}
          variant="outline"
          className="w-full text-base py-6 border-2 hover:bg-accent hover:border-primary"
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Sign up with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or sign up with email
            </span>
          </div>
        </div>

        {/* Email/Password Signup Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Account Type Selection */}
            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-semibold">I am a...</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 gap-3"
                    >
                      {accountTypeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <div key={option.value}>
                            <RadioGroupItem
                              value={option.value}
                              id={option.value}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={option.value}
                              className="flex items-start space-x-3 rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent hover:border-primary cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                            >
                              <Icon className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="font-medium">{option.label}</div>
                                <div className="text-sm text-muted-foreground">
                                  {option.description}
                                </div>
                              </div>
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Full Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="John Doe" 
                        {...field} 
                        className="pl-10 bg-background text-base md:text-sm"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="email" 
                        placeholder="you@example.com" 
                        {...field} 
                        className="pl-10 bg-background text-base md:text-sm"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        className="pl-10 bg-background text-base md:text-sm"
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Must be 8+ characters with uppercase, lowercase, and number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        className="pl-10 bg-background text-base md:text-sm"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Terms Acceptance */}
            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal">
                      I agree to the{' '}
                      <Link href="/terms" className="text-primary underline-offset-4 hover:underline">
                        Terms & Conditions
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
                        Privacy Policy
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={isLoading || isGoogleLoading} 
              className="w-full text-base py-6"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-5 w-5" />
              )}
              Create Account
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex-col items-center gap-4 pt-4 border-t">
        <p className="text-sm text-muted-foreground text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
        <p className="text-xs text-muted-foreground text-center">
          🔒 Secure authentication powered by Google Firebase
        </p>
      </CardFooter>
    </Card>
  );
}
