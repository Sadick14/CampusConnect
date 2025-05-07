
'use client'; // Mark as client component

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { PageHeader } from "@/components/common/page-header";
import { PlaceholderContent } from "@/components/common/placeholder-content";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/auth-context';
import { adminCreateUserProfile } from '@/services/user'; // Re-use admin create for simplicity, setting role to 'student'


// Zod schema for adding a new student, including parent contact
const NewStudentSchema = z.object({
  name: z.string().min(2, "Student name must be at least 2 characters."),
  email: z.string().email("A valid email is required for the student's account."), // Student needs an email for potential login
  password: z.string().min(8, "Password must be at least 8 characters."), // Initial password
  class: z.string().min(1, "Class/Grade level is required."),
  // Parent Contact Information (Optional)
  parentName: z.string().optional(),
  parentEmail: z.string().email("Invalid parent email address.").optional().or(z.literal('')), // Allow empty string
  parentPhone: z.string().optional(),
});

type NewStudentData = z.infer<typeof NewStudentSchema>;

export default function StudentsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();

  const form = useForm<NewStudentData>({
    resolver: zodResolver(NewStudentSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      class: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
    },
  });

  async function onSubmit(values: NewStudentData) {
    if (!currentUser || !currentUser.schoolId || (currentUser.role !== 'school_admin' && currentUser.role !== 'teacher')) {
      toast({ title: "Permission Denied", description: "You do not have permission to add students.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      // Prepare data for adminCreateUserProfile
      const userProfileData = {
        name: values.name,
        email: values.email,
        password: values.password,
        role: 'student' as const, // Explicitly set role to student
        schoolId: currentUser.schoolId, // Assign to the current admin/teacher's school
         // Add parent contact details directly to the user profile data
         // Note: Ensure your `adminCreateUserProfile` and `User` interface handle this extra field.
         // You might need a specific student profile structure if it differs significantly.
        'class': values.class, // Store class info
        parentContact: { // Nested object for parent info
          name: values.parentName || null,
          email: values.parentEmail || null,
          phone: values.parentPhone || null,
        },
      };

      // Create the user (Auth + Firestore profile)
      const newStudent = await adminCreateUserProfile(userProfileData, currentUser.role, currentUser.schoolId);

      toast({
        title: "Student Added Successfully!",
        description: `Student profile and login created for ${newStudent.name}.`,
      });
      form.reset(); // Clear the form
      // TODO: Refresh student list if displaying one on this page

    } catch (error: any) {
      console.error("Error adding student:", error);
      toast({
        title: "Failed to Add Student",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- Render Logic ---
   if (authLoading) {
     return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
   }

   if (!currentUser || (currentUser.role !== 'school_admin' && currentUser.role !== 'teacher')) {
     return (
       <div>
         <PageHeader title="Student Management" description="Access Denied" />
         <PlaceholderContent title="Permission Required" message="You need School Admin or Teacher permissions to manage students." />
       </div>
     );
   }

  return (
    <div>
      <PageHeader
        title="Student Management"
        description="Manage student records, profiles, and enrollment."
        // Action button could open a dialog or link to a separate add page
        // actions={<Button><UserPlus className="mr-2 h-4 w-4" /> Add New Student</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Add Student Form Card */}
         <Card className="lg:col-span-1 shadow-lg">
           <CardHeader>
             <CardTitle className="flex items-center gap-2 text-primary">
               <UserPlus className="h-5 w-5" /> Add New Student
             </CardTitle>
             <CardDescription>
               Enter the details for the new student. An account will be created for them.
             </CardDescription>
           </CardHeader>
           <Form {...form}>
             <form onSubmit={form.handleSubmit(onSubmit)}>
               <CardContent className="space-y-4">
                  {/* Student Details */}
                 <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Student Full Name</FormLabel><FormControl><Input placeholder="Student's Full Name" {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Student Email</FormLabel><FormControl><Input type="email" placeholder="student@example.com" {...field} /></FormControl><FormDescription>Used for student login.</FormDescription><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Initial Password</FormLabel><FormControl><Input type="password" placeholder="Min. 8 characters" {...field} /></FormControl><FormDescription>Student should change this after first login.</FormDescription><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="class" render={({ field }) => ( <FormItem><FormLabel>Class / Grade</FormLabel><FormControl><Input placeholder="e.g., Grade 10A, Class 5" {...field} /></FormControl><FormMessage /></FormItem> )} />

                  {/* Parent/Guardian Details */}
                  <h4 className="text-sm font-medium text-muted-foreground pt-4 border-t">Parent/Guardian Contact (Optional)</h4>
                  <FormField control={form.control} name="parentName" render={({ field }) => ( <FormItem><FormLabel>Parent/Guardian Name</FormLabel><FormControl><Input placeholder="Parent's Full Name" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="parentEmail" render={({ field }) => ( <FormItem><FormLabel>Parent/Guardian Email</FormLabel><FormControl><Input type="email" placeholder="parent@example.com" {...field} /></FormControl><FormDescription>Used for communication (newsletters, etc.).</FormDescription><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="parentPhone" render={({ field }) => ( <FormItem><FormLabel>Parent/Guardian Phone</FormLabel><FormControl><Input type="tel" placeholder="+1234567890" {...field} /></FormControl><FormDescription>Used for SMS communication.</FormDescription><FormMessage /></FormItem> )} />

               </CardContent>
               <CardFooter>
                 <Button type="submit" disabled={isSubmitting} className="w-full">
                   {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                   Add Student
                 </Button>
               </CardFooter>
             </form>
           </Form>
         </Card>

        {/* Placeholder for Student List */}
        <div className="lg:col-span-2">
          <PlaceholderContent
            title="Student List"
            message="A list of registered students will appear here. Functionality to view, edit, and manage student profiles will be added."
          />
           {/* TODO: Implement student list fetching and display */}
           {/* Example: <StudentTable schoolId={currentUser.schoolId} /> */}
        </div>
      </div>
    </div>
  );
}

// Extend the User interface in user.ts to include 'class' and 'parentContact' fields.
// Update `adminCreateUserProfile` in user.ts to accept and save these extra fields.
// Ensure Firestore rules allow writing these fields to the 'users' collection.
