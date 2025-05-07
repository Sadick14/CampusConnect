
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
import { PlusCircle, Loader2, ShieldAlert, ClipboardCopy } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { registerSchool, type School } from '@/services/school';
import { NewSchoolSchema, type NewSchoolData } from '@/schemas/school';
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
      adminUid: "", // Initialize adminUid field
    },
  });

  // Function to copy text to clipboard
  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text).then(() => {
        toast({ title: "Copied to clipboard!", description: text });
      }).catch(err => {
        toast({ title: "Copy failed", description: "Could not copy text.", variant: "destructive" });
        console.error('Failed to copy text: ', err);
      });
    };


  async function onSubmit(values: NewSchoolData) {
    setIsLoading(true);
    try {
      // Pass the full validated data including adminUid
      const newSchool: School = await registerSchool(values);
      toast({
        title: "School Registered & Admin Profile Linked!",
        description: (
          <div className="space-y-2">
            <p>{`${newSchool.name} has been successfully registered.`}</p>
            <p>Admin profile created/linked for: <strong className="font-mono">{newSchool.adminEmail}</strong></p>
            <p>Using Firebase Auth UID: <strong className="font-mono text-primary">{newSchool.adminUid}</strong></p>
            <p className="text-xs text-muted-foreground">The school admin can now log in using their Firebase Authentication credentials.</p>
          </div>
        ),
        duration: 10000,
      });
      router.push("/schools");
    } catch (error) {
      console.error("Error registering school:", error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred. Ensure the admin email or UID is not already linked to another profile.",
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
        description="Add a new school and link its administrator's pre-created Firebase Auth account."
      />
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <PlusCircle className="h-5 w-5" /> School Registration Form
          </CardTitle>
          <CardDescription>
            Fill in the details below to register a new school. Requires a pre-existing Firebase Auth account for the admin.
          </CardDescription>
        </CardHeader>
         <Alert variant="destructive" className="m-6 mt-0">
           <ShieldAlert className="h-4 w-4" />
           <AlertTitle>Important: Manual Admin Auth Creation First</AlertTitle>
           <AlertDescription className="space-y-1">
                <p>Before submitting this form:</p>
                <ol className="list-decimal list-inside pl-4 text-sm">
                    <li><strong className="font-bold">Manually Create Firebase Auth User:</strong> Go to your Firebase Console → Authentication → Users → Add user.</li>
                    <li>Use the intended Admin Email and set a Password.</li>
                    <li><strong className="font-bold text-primary">Copy the User UID:</strong> After creating the user, copy the generated UID.</li>
                    <li><strong className="font-bold">Paste UID Below:</strong> Enter the copied UID into the "Admin Auth UID" field in this form.</li>
                </ol>
                <p className="mt-2">This process ensures the school admin's login (Firebase Auth) is correctly linked to their profile (Firestore) within the app.</p>
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
                      <Input type="email" placeholder="Enter admin's EXISTING Firebase Auth email" {...field} />
                    </FormControl>
                    <FormDescription>
                      The email address matching the pre-created Firebase Auth user.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="adminUid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Auth UID</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input placeholder="Paste the Firebase Auth User UID here" {...field} />
                         {/* Optional: Add a button to copy the example UID for testing superadmin setup */}
                         {field.name === 'adminUid' && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard('example-uid-12345')} // Replace with a relevant example or remove
                              title="Copy Example UID (for testing)"
                            >
                              <ClipboardCopy className="h-4 w-4" />
                            </Button>
                          )}
                      </div>
                    </FormControl>
                    <FormDescription>
                     The unique User ID obtained from the Firebase Authentication console after creating the admin user.
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
                Register School & Link Admin
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
