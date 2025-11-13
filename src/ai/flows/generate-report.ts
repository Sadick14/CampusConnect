'use server';

/**
 * @fileOverview AI-powered end-of-term report generation.
 *
 * - generateTermReport - A function that generates a term report.
 * - GenerateTermReportInput - The input type for the generateTermReport function.
 * - GenerateTermReportOutput - The return type for the generateTermReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTermReportInputSchema = z.object({
  organizationId: z.string().describe('The ID of the organization/school for which to generate the report.'),
  schoolId: z.string().optional().describe('Deprecated - use organizationId'),
  term: z.string().describe('The term for which to generate the report (e.g., Fall 2024).'),
  academicYear: z.string().describe('The academic year for the report (e.g., 2024-2025).'),
  studentPerformanceData: z
    .string()
    .describe('Summary of student performance data, including grades and assessments.'),
  attendanceRecords: z.string().describe('Summary of attendance records for the term.'),
  teacherFeedback: z.string().describe('Summary of teacher feedback on student performance.'),
});
export type GenerateTermReportInput = z.infer<typeof GenerateTermReportInputSchema>;

const GenerateTermReportOutputSchema = z.object({
  report: z.string().describe('The generated end-of-term report.'),
});
export type GenerateTermReportOutput = z.infer<typeof GenerateTermReportOutputSchema>;

export async function generateTermReport(input: GenerateTermReportInput): Promise<GenerateTermReportOutput> {
  return generateTermReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTermReportPrompt',
  input: {schema: GenerateTermReportInputSchema},
  output: {schema: GenerateTermReportOutputSchema},
  prompt: `You are an AI assistant that specializes in generating end-of-term reports for schools.

  Using the following information, generate a comprehensive end-of-term report:

  School ID: {{{schoolId}}}
  Term: {{{term}}}
  Academic Year: {{{academicYear}}}
  Student Performance Data: {{{studentPerformanceData}}}
  Attendance Records: {{{attendanceRecords}}}
  Teacher Feedback: {{{teacherFeedback}}}

  The report should include an overview of the school's performance, key achievements,
  areas for improvement, and recommendations for the next term. Focus on providing
  actionable insights that the administrator can use to improve overall school performance.
  Format the report to be well-structured and easy to read.
  `,
});

const generateTermReportFlow = ai.defineFlow(
  {
    name: 'generateTermReportFlow',
    inputSchema: GenerateTermReportInputSchema,
    outputSchema: GenerateTermReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
