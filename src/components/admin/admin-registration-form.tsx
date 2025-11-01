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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, School, User, Mail, Lock, Building, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp, collection, Timestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase-server';
import { Separator } from '@/components/ui/separator';
import { initializeTrialSubscription } from '@/services/subscription';
import { calculateTrialExpiry, SUBSCRIPTION_PLANS } from '@/schemas/subscription';

const adminRegistrationSchema = z.object({
  // School Information
  schoolName: z.string().min(3, 'School name must be at least 3 characters'),
  schoolAddress: z.string().min(5, 'Address is required'),
  schoolPhone: z.string().min(10, 'Valid phone number required'),
  schoolEmail: z.string().email('Invalid email address'),
  schoolDescription: z.string().optional(),
  
  // Admin Information
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
  adminEmail: z.string().email('Invalid email address'),
  adminPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AdminRegistrationValues = z.infer<typeof adminRegistrationSchema>;

export function AdminRegistrationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AdminRegistrationValues>({
    resolver: zodResolver(adminRegistrationSchema),
    defaultValues: {
      schoolName: '',
      schoolAddress: '',
      schoolPhone: '',
      schoolEmail: '',
      schoolDescription: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: AdminRegistrationValues) {
    setIsLoading(true);
    try {
      // Create school admin user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.adminEmail,
        values.adminPassword
      );
      
      const firebaseUser = userCredential.user;

      // Update display name
      await updateProfile(firebaseUser, {
        displayName: values.adminName
      });

      const db = getDb();
      
      // Create school document with auto-generated ID
      const schoolRef = doc(collection(db, 'schools'));
      const schoolId = schoolRef.id;
      
      // Calculate trial dates
      const now = new Date();
      const trialEndDate = calculateTrialExpiry(now);
      
      await setDoc(schoolRef, {
        id: schoolId,
        name: values.schoolName,
        address: values.schoolAddress,
        phone: values.schoolPhone,
        email: values.schoolEmail,
        description: values.schoolDescription || '',
        logoUrl: null,
        adminId: firebaseUser.uid,
        
        // Initialize subscription fields
        subscriptionStatus: 'trial',
        subscriptionType: 'TRIAL',
        trialStartDate: Timestamp.fromDate(now),
        trialEndDate: Timestamp.fromDate(trialEndDate),
        isTrialActive: true,
        daysRemaining: SUBSCRIPTION_PLANS.TRIAL.duration,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        nextBillingDate: null,
        lastPaymentDate: null,
        totalAmountPaid: 0,
        paymentStatus: 'none',
        
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create user profile in Firestore
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, {
        id: firebaseUser.uid,
        name: values.adminName,
        email: values.adminEmail,
        role: 'school_admin',
        schoolId: schoolId,
        schoolName: values.schoolName,
        schoolLogoUrl: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // Initialize trial subscription
      await initializeTrialSubscription(schoolId, values.schoolName);

      toast({
        title: 'School Registered Successfully!',
        description: `${values.schoolName} has been registered with a 10-day free trial. Admin: ${values.adminEmail}`,
      });

      // Reset form
      form.reset();

      // Optionally redirect to schools list
      setTimeout(() => {
        router.push('/schools');
      }, 2000);

    } catch (error: any) {
      console.error('Error registering school:', error);
      let errorMessage = 'Failed to register school. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This admin email is already registered.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid admin email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak.';
      }

      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* School Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5 text-primary" />
              School Information
            </CardTitle>
            <CardDescription>
              Enter the details for the new school
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="schoolName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="e.g. Springfield High School" 
                        {...field} 
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schoolAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea 
                        placeholder="123 Main Street, City, State, ZIP" 
                        {...field} 
                        className="pl-10 min-h-[80px]"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="schoolPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="+1 (555) 123-4567" 
                          {...field} 
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="schoolEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="email"
                          placeholder="info@school.edu" 
                          {...field} 
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="schoolDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the school..." 
                      {...field} 
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of the school (mission, values, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Separator />

        {/* School Admin Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              School Administrator
            </CardTitle>
            <CardDescription>
              Create the admin account for this school
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="adminName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Full Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="John Doe" 
                        {...field} 
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adminEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="email"
                        placeholder="admin@school.edu" 
                        {...field} 
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    This will be used for signing in to the system
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="adminPassword"
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
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      8+ chars, uppercase, lowercase, number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/schools')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="min-w-[150px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <School className="mr-2 h-4 w-4" />
                Register School
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
