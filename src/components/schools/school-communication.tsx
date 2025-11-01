
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
import { Mail, MessageSquareText, Loader2, MessageSquare } from "lucide-react"; // Use MessageSquareText for SMS
import { useToast } from "@/hooks/use-toast";
import { type StudentWithContact } from '@/services/user'; // Import student type with contact
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select

const communicationFormSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters long.").optional(), // Optional for SMS
  message: z.string().min(10, "Message must be at least 10 characters long."),
  communicationType: z.enum(["email", "sms"]).default("email"),
});

type CommunicationFormValues = z.infer<typeof communicationFormSchema>;

interface SchoolCommunicationProps {
    schoolId: string;
    students: StudentWithContact[]; // Receive student data with parent contacts
}

export default function SchoolCommunication({ schoolId, students }: SchoolCommunicationProps) {
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

  // Watch the communication type to conditionally require subject
  const communicationType = form.watch("communicationType");

  async function onSubmit(values: CommunicationFormValues) {
     // Validate subject for email
     if (values.communicationType === 'email' && !values.subject?.trim()) {
       form.setError('subject', { type: 'manual', message: 'Subject is required for emails.' });
       return;
     }

    setIsLoading(true);

    try {
      // --- Actual Sending Logic Placeholder ---
      // In a real application, you would:
      // 1. Filter students to get unique parent email addresses or phone numbers based on `values.communicationType`.
      // 2. Integrate with an Email Service Provider (ESP) like SendGrid, Mailgun, or AWS SES for emails.
      // 3. Integrate with an SMS Gateway Provider like Twilio, Vonage, or AWS SNS for SMS.
      // 4. Send the messages in batches using the respective provider's API.
      // 5. Handle API responses, errors, and potentially track delivery status.

      const parentEmails = new Set<string>();
      const parentPhones = new Set<string>();

      students.forEach(student => {
          if (student.parentContact?.email) {
              parentEmails.add(student.parentContact.email);
          }
          if (student.parentContact?.phone) {
               // Basic phone number cleaning (example)
               const cleanedPhone = student.parentContact.phone.replace(/[^+\d]/g, ''); // Remove non-digits except +
               if (cleanedPhone) parentPhones.add(cleanedPhone);
          }
      });

      const targetAudience = values.communicationType === 'email'
        ? Array.from(parentEmails)
        : Array.from(parentPhones);

       if (targetAudience.length === 0) {
          toast({
            title: "No Recipients",
            description: `No parent ${values.communicationType === 'email' ? 'email addresses' : 'phone numbers'} found for this school.`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
       }

      if (values.communicationType === 'email') {
        // Send actual emails to parents
        try {
          const { sendParentNotification } = await import('@/services/email');
          
          // Get school name for the email
          const school = students[0]?.schoolName || 'Your School';
          
          const emailResult = await sendParentNotification(
            targetAudience as string[],
            school,
            values.subject || 'School Notification',
            values.message
          );
          
          if (emailResult.success) {
            toast({
              title: "Emails Sent Successfully!",
              description: `Email notifications have been sent to ${targetAudience.length} parent(s).`,
            });
          } else {
            throw new Error(emailResult.error || 'Failed to send emails');
          }
        } catch (error) {
          console.error('Failed to send emails:', error);
          toast({
            title: "Email Failed",
            description: "Failed to send email notifications. Please check your email configuration.",
            variant: "destructive",
          });
          return;
        }
      } else {
        // SMS functionality - placeholder for now
        console.log(`Sending SMS to:`, targetAudience);
        console.log("Message:", values.message);
        
        // For now, show a message that SMS is not yet implemented
        toast({
          title: "SMS Feature Coming Soon",
          description: `SMS functionality will be available soon. For now, consider using email communication.`,
          variant: "default",
        });
        return;
      }

      form.reset(); // Clear form on success

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
          {communicationType === 'email' ? <Mail className="h-5 w-5" /> : <MessageSquareText className="h-5 w-5" />}
           Parent Communication
        </CardTitle>
        <CardDescription>
          Send announcements or newsletters to parents via email or SMS. Requires parent contact info in student profiles.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
             <FormField
                  control={form.control}
                  name="communicationType"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Communication Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Select communication method" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          <SelectItem value="email">
                              <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" /> Email
                              </div>
                              </SelectItem>
                          <SelectItem value="sms">
                              <div className="flex items-center gap-2">
                                  <MessageSquareText className="h-4 w-4" /> SMS
                              </div>
                              </SelectItem>
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
              />

            {/* Subject Field (Conditional) */}
            {communicationType === 'email' && (
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter the subject of the email"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`Enter the ${communicationType === 'email' ? 'email body' : 'SMS message'} you want to send to parents.`}
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                   <FormDescription>
                     {communicationType === 'sms' && 'Note: Standard SMS character limits and costs may apply.'}
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
                 communicationType === 'email' ? <Mail className="mr-2 h-4 w-4" /> : <MessageSquareText className="mr-2 h-4 w-4" />
              )}
              Send {communicationType === 'email' ? 'Email' : 'SMS'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
