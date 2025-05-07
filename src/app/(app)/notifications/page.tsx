
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
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context"; // Import useAuth

const notificationFormSchema = z.object({
  message: z.string().min(10, "Message must be at least 10 characters long."),
});

type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export default function NotificationsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth(); // Get current user

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      message: "",
    },
  });


  async function onSubmit(values: NotificationFormValues) {
    setIsLoading(true);

    try {
      // Simulate sending a notification (replace with actual logic)
      // In a real application, you would:
      // 1. Store the notification in a database.
      // 2. Use a background task or queue to send the notification to relevant school admins.

      console.log("Sending Notification:", values.message);

      // For demonstration purposes, just show a toast message
      toast({
        title: "Notification Sent",
        description: "The notification has been sent to all school admins.",
      });

    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: "Failed to send the notification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Conditionally render based on user role
  if (currentUser?.role !== 'superadmin') {
    return (
      <div className="container mx-auto py-2">
        <PageHeader
          title="Notifications"
          description="You do not have permission to view this page."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Send Notifications"
        description="Send global notifications to all school admins."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Send className="h-5 w-5" /> Send Notification to School Admins
            </CardTitle>
            <CardDescription>
              Compose and send a message to all school administrators.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the message you want to send to all school admins."
                          className="min-h-[150px]"
                          {...field}
                        />
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
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send Notification
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
