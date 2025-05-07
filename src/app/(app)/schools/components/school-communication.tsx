
'use client';

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const communicationFormSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters long."),
  message: z.string().min(10, "Message must be at least 10 characters long."),
  communicationType: z.enum(["email", "sms"]).default("email"),
});

type CommunicationFormValues = z.infer<typeof communicationFormSchema>;

interface SchoolCommunicationProps {
    schoolId: string; // Ensure the component receives the schoolId as a prop
}

export default function SchoolCommunication({ schoolId }: SchoolCommunicationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CommunicationFormValues>({
    resolver: zodResolver(communicationFormSchema),
    defaultValues: {
      subject: "",
      message: "",
      communicationType: "email",
    },
  });


  async function onSubmit(values: CommunicationFormValues) {
    setIsLoading(true);

    try {
      // Simulate sending communication (replace with actual logic)
      // In a real application, you would:
      // 1. Retrieve the list of parent email addresses or phone numbers associated with the schoolId.
      // 2. Use an email/SMS service to send the messages.

      console.log("Sending Communication:", { ...values, schoolId });

      // For demonstration purposes, just show a toast message
      toast({
        title: `Communication Sent via ${values.communicationType.toUpperCase()}`,
        description: `The ${values.communicationType} has been sent to all parents of school ID ${schoolId}.`,
      });

    } catch (error) {
      console.error("Error sending communication:", error);
      toast({
        title: "Error",
        description: "Failed to send the communication. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Mail className="h-5 w-5" /> School Communication
        </CardTitle>
        <CardDescription>
          Send announcements or newsletters to parents via email or SMS.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
             <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <input
                      placeholder="Enter the subject of the communication"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the message you want to send to parents."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="communicationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Communication Type</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      {...field}
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                  </FormControl>
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
                <MessageSquare className="mr-2 h-4 w-4" />
              )}
              Send Communication
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
