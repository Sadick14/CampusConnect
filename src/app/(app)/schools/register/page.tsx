
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Loader2, ShieldAlert, Eye, EyeOff } from "lucide-react"; // Added Eye icons
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { registerSchool, type School } from '@/services/school';
import { NewSchoolSchema, type NewSchoolData } from '@/schemas/school';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function RegisterSchoolPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<NewSchoolData>({
    resolver: zodResolver(NewSchoolSchema),
    defaultValues: {
      name: "",
      adminEmail: "",
      adminPassword: "", // Initialize adminPassword field
    },
  });

  async function onSubmit(values: NewSchoolData) {
    setIsLoading(true);
    try {
      // Call the updated registerSchool function which now handles Auth creation
      const newSchool: School = await registerSchool(values);
      toast({
        title: "School Registered & Admin Created!",
        description: (
          <div className="space-y-2">
            <p>{`${newSchool.name} has been successfully registered.`}</p>
            <p>Admin authentication account created for: <strong className="font-mono">{newSchool.adminEmail}</strong></p>
            <p>Firestore profile created with UID: <strong className="font-mono text-primary">{newSchool.adminUid}</strong></p>
            <p className="text-xs text-muted-foreground">The school admin can now log in using their email and the password provided.</p>
          </div>
        ),
        duration: 10000, // Keep toast longer
      });
      router.push("/schools"); // Redirect after successful registration
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
    <div>
      <PageHeader
        title="Register New School"
        description="Add a new school and create its primary administrator account."
      />
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <PlusCircle className="h-5 w-5" /> School Registration Form
          </CardTitle>
          <CardDescription>
            Fill in the details below to register a new school and its admin.
          </CardDescription>
        </CardHeader>
         <Alert variant="default" className="m-6 mt-0 border-primary/50">
           <ShieldAlert className="h-4 w-4 text-primary" />
           <AlertTitle className="text-primary">Admin Account Creation</AlertTitle>
           <AlertDescription>
                <p>This form will create both the school record and the initial school administrator's login account.</p>
                <p className="mt-1">Please provide a secure password for the admin.</p>
           </AlertDescription>
         </Alert>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter school name (e.g., Green Valley High)" {...field} />
                    </FormControl>
                    <FormDescription>
                      The official name of the school.
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
                    <FormLabel>School Admin Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter admin's email address" {...field} />
                    </FormControl>
                    <FormDescription>
                      This email will be used for the admin's login.
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
                    <FormLabel>Admin Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter a strong password for the admin"
                           {...field}
                         />
                         <Button
                           type="button"
                           variant="ghost"
                           size="icon"
                           className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                           onClick={() => setShowPassword(!showPassword)}
                           tabIndex={-1} // Prevent tabbing to the button
                         >
                           {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                           <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                         </Button>
                       </div>
                    </FormControl>
                    <FormDescription>
                      Must be at least 8 characters long. The admin can change this later.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                Register School & Create Admin
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
