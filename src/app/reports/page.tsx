'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateTermReport, type GenerateTermReportInput } from '@/ai/flows/generate-report';

const reportFormSchema = z.object({
  schoolId: z.string().min(1, "School ID is required."),
  term: z.string().min(1, "Term is required."),
  academicYear: z.string().min(1, "Academic Year is required."),
  studentPerformanceData: z.string().min(10, "Student performance data is required."),
  attendanceRecords: z.string().min(10, "Attendance records are required."),
  teacherFeedback: z.string().min(10, "Teacher feedback is required."),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

export default function AiReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      schoolId: "",
      term: "",
      academicYear: "",
      studentPerformanceData: "",
      attendanceRecords: "",
      teacherFeedback: "",
    },
  });

  async function onSubmit(values: ReportFormValues) {
    setIsLoading(true);
    setGeneratedReport(null);
    try {
      const input: GenerateTermReportInput = values;
      const result = await generateTermReport(input);
      setGeneratedReport(result.report);
      toast({
        title: "Report Generated",
        description: "The AI-powered term report has been successfully generated.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="AI Report Generation"
        description="Generate end-of-term/semester reports using AI, incorporating attendance, grades, and teacher feedback."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" /> Generate Term Report
            </CardTitle>
            <CardDescription>
              Fill in the details below to generate an AI-powered report.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="schoolId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter school ID (e.g., SCH001)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                   <FormField
                    control={form.control}
                    name="term"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Term</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Fall 2024, Semester 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="academicYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Year</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2024-2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="studentPerformanceData"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Performance Data Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Summarize overall student performance, key achievements, and areas needing improvement based on grades and assessments."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a concise summary of academic performance.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="attendanceRecords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attendance Records Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Summarize attendance trends, notable patterns, and any concerns."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="teacherFeedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher Feedback Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Summarize common themes from teacher feedback regarding student engagement, behavior, and progress."
                          className="min-h-[80px]"
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
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate Report
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary">Generated Report</CardTitle>
            <CardDescription>
              The AI-generated report will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[400px] rounded-md border border-dashed p-4">
            {isLoading && (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
                <p>Generating report, please wait...</p>
              </div>
            )}
            {!isLoading && !generatedReport && (
              <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                <p>Your generated report will be displayed here once the form is submitted.</p>
              </div>
            )}
            {generatedReport && (
              <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap rounded-md bg-muted/30 p-4">
                {generatedReport}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
