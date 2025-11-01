'use client';

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { NewSchoolSchema, type NewSchoolData } from '@/schemas/school';
import { registerSchool, type School } from '@/services/school';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, School as SchoolIcon, Calendar, CreditCard } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SelfRegisterSchoolPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<NewSchoolData>({
    resolver: zodResolver(NewSchoolSchema),
    defaultValues: {
      name: "",
      adminEmail: "",
      adminPassword: "",
    },
  });

  async function onSubmit(values: NewSchoolData) {
    setIsLoading(true);
    try {
      const newSchool: School = await registerSchool(values);
      
      toast({
        title: "🎉 Welcome to CampusConnect!",
        description: (
          <div className="space-y-2">
            <p><strong>{newSchool.name}</strong> has been successfully registered!</p>
            <p>✅ Your admin account is ready</p>
            <p>📅 Free trial: <strong className="text-green-600">{newSchool.daysRemaining} days remaining</strong></p>
            <p className="text-xs text-muted-foreground">You can start using CampusConnect immediately!</p>
          </div>
        ),
        duration: 8000,
      });
      
      // Redirect to login page
      router.push("/login?message=registration-complete");
    } catch (error) {
      console.error("Error registering school:", error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred during registration.",
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <SchoolIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Join CampusConnect</h1>
          <p className="text-gray-600 mt-2">Start managing your school today with a free 14-day trial</p>
        </div>

        {/* Trial Benefits Alert */}
        <Alert className="mb-6 border-green-200 bg-green-50">
          <Calendar className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">14-Day Free Trial</AlertTitle>
          <AlertDescription className="text-green-700">
            <ul className="mt-2 space-y-1 text-sm">
              <li>✓ Full access to all features</li>
              <li>✓ Unlimited students and staff</li>
              <li>✓ No setup fees or hidden costs</li>
              <li>✓ Cancel anytime during trial</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Registration Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Register Your School</CardTitle>
            <CardDescription>
              Create your school account and start your free trial immediately
            </CardDescription>
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Green Valley High School" {...field} />
                      </FormControl>
                      <FormDescription>
                        The official name of your educational institution
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="admin@yourschool.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        This will be your login email as the school administrator
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="adminPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Create Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a secure password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Minimum 8 characters. Keep this secure!
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" disabled={isLoading} className="w-full h-11 text-base">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <SchoolIcon className="mr-2 h-4 w-4" />
                  )}
                  Start Free Trial
                </Button>
                
                <div className="text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Button variant="link" className="p-0 h-auto font-medium text-blue-600" asChild>
                    <a href="/login">Sign in here</a>
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>

        {/* Payment Info */}
        <Alert className="mt-6 border-blue-200 bg-blue-50">
          <CreditCard className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Payment Information</AlertTitle>
          <AlertDescription className="text-blue-700">
            After your 14-day trial, choose from flexible payment plans starting from GHS 50/month. 
            Your account will be temporarily locked until payment is confirmed.
          </AlertDescription>
        </Alert>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          By registering, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
}