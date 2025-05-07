
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
import { PlusCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { registerSchool, NewSchoolSchema, type NewSchoolData } from '@/services/school';

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
      await registerSchool(values);
      toast({
        title: "School Registered",
        description: `${values.name} has been successfully registered. An admin account has been created with the provided email.`,
      });
      router.push("/schools");
    } catch (error) {
      console.error("Error registering school:", error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred. Ensure the admin email is not already in use by another school admin.",
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
                      The email address for the primary administrator of this school. A new user account will be created with this email and a temporary password sent (or a default one set).
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
                Register School
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
