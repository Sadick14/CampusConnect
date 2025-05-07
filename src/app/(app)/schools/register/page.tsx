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
import { PlusCircle, Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { registerSchool, type School } from '@/services/school';
import { NewSchoolSchema, type NewSchoolData } from '@/schemas/school'; // Updated import path
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function RegisterSchoolPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<NewSchoolData>({
    resolver: zodResolver(NewSchoolSchema),
    defaultValues: {
      name: "",
      adminEmail: "",
    },
  });

  async function onSubmit(values: NewSchoolData) {
    setIsLoading(true);
    try {
      const newSchool: School = await registerSchool(values);
      toast({
        title: "School Registered & Admin Profile Created!",
        description: (
          <div className="space-y-2">
            <p>{`${newSchool.name} has been successfully registered.`}</p>
            <p>An admin Firestore profile was created for: <strong className="font-mono">{newSchool.adminEmail}</strong></p>
            <p className="font-semibold text-destructive">
                NEXT STEP: Manually create Firebase Authentication user:
            </p>
             <ul className="list-disc list-inside pl-4 text-sm bg-muted p-2 rounded">
                <li>Email: <strong className="font-mono">{newSchool.adminEmail}</strong></li>
                <li>UID: <strong className="font-mono text-primary">{newSchool.adminUid}</strong> (Use this Firestore Admin ID as Auth UID)</li>
            </ul>
             <p className="text-xs text-muted-foreground">This links their login to the school admin profile and role.</p>
          </div>
        ),
        duration: 15000, // Longer duration for important message
      });
      router.push("/schools");
    } catch (error) {
      console.error("Error registering school:", error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred. Ensure the admin email is not already in use by another school admin or superadmin.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Register New School"
        description="Add a new school to the CampusConnect Pro system. This will also create an initial admin account for the school."
      />
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <PlusCircle className="h-5 w-5" /> School Registration Form
          </CardTitle>
          <CardDescription>
            Fill in the details below to register a new school and its administrator.
          </CardDescription>
        </CardHeader>
         <Alert variant="destructive" className="m-6 mt-0">
           <ShieldAlert className="h-4 w-4" />
           <AlertTitle>Important: Manual Admin Setup Required</AlertTitle>
           <AlertDescription>
               After successfully submitting this form, a Firestore profile for the school admin will be created. You <strong className="font-bold">MUST THEN MANUALLY CREATE</strong> a Firebase Authentication user for this admin.
               The success message will provide the <strong className="font-bold text-primary">Firestore Admin Profile ID</strong>. Use this ID as the <strong className="font-bold text-primary">User UID</strong> when creating the Firebase Auth user.
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
                      <Input type="email" placeholder="Enter admin email (e.g., admin@greenvalley.edu)" {...field} />
                    </FormControl>
                    <FormDescription>
                      The email address for the primary administrator of this school.
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
                Register School & Create Admin Profile
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
