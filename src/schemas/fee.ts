import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

/**
 * Fee Type Definition - Different categories of fees
 */
export interface FeeType {
  id: string;
  schoolId: string;
  name: 'school_fees' | 'feeding_fees' | 'books' | 'transportation' | 'uniform' | 'activity' | 'other';
  displayName: string;
  description: string;
  isRecurring: boolean; // true for monthly/termly, false for one-time
  frequency?: 'monthly' | 'termly' | 'annual' | 'weekly'; // Recurrence pattern
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Fee Structure for a Class/Grade
 * Defines how much each fee type costs for a specific class
 */
export interface ClassFeeStructure {
  classId: string;
  className: string;
  feeType: 'school_fees' | 'feeding_fees' | 'books' | 'transportation' | 'uniform' | 'activity' | 'other';
  amount: number; // Amount in GHS
  currency: string; // 'GHS'
  description?: string;
  isActive: boolean;
  startDate: Timestamp;
  endDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Fee Record for a Student
 * Tracks what fees are due for a specific student
 */
export interface StudentFeeRecord {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  className: string;
  feeType: 'school_fees' | 'feeding_fees' | 'books' | 'transportation' | 'uniform' | 'activity' | 'other';
  amount: number; // Total amount due in GHS
  currency: string; // 'GHS'
  dueDate: Timestamp;
  term?: string; // 'term_1', 'term_2', 'term_3'
  academicYear: string; // '2024/2025'
  
  // Payment tracking
  paidAmount: number; // Amount already paid
  pendingAmount: number; // Amount still due
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue' | 'exempted';
  
  // Additional info
  notes?: string;
  attachments?: string[]; // URLs to documents like fee receipts
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastReminderSent?: Timestamp;
}

/**
 * Payment Record
 * Records each individual payment transaction
 */
export interface PaymentRecord {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  feeRecordId: string; // Links to StudentFeeRecord
  paymentType: 'school_fees' | 'feeding_fees' | 'books' | 'transportation' | 'uniform' | 'activity' | 'other';
  amount: number; // Amount paid in GHS
  currency: string; // 'GHS'
  
  // Payment details
  paymentMethod: 'cash' | 'bank_transfer' | 'momo' | 'card' | 'cheque' | 'other';
  transactionId?: string; // Reference from payment provider
  receiptNumber: string; // Generated receipt
  
  // Payment recording
  recordedBy: string; // User ID of person who recorded payment
  paymentDate: Timestamp; // When payment was made
  recordedDate: Timestamp; // When payment was recorded in system
  
  // Status and notes
  status: 'pending' | 'confirmed' | 'rejected'; // Pending for manager approval
  notes?: string;
  approvedBy?: string; // User ID of approver
  approvalDate?: Timestamp;
  
  // Documents
  receiptUrl?: string;
  attachments?: string[]; // URLs to supporting documents
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Fee Payment Reminder
 * Tracks reminder notifications sent to parents/students
 */
export interface PaymentReminder {
  id: string;
  schoolId: string;
  feeRecordId: string;
  studentId: string;
  reminderType: 'due_date' | 'overdue_7days' | 'overdue_30days' | 'final_notice';
  sentDate: Timestamp;
  sentTo: string; // Email or phone number
  notificationChannel: 'email' | 'sms' | 'in_app';
  message: string;
  read: boolean;
  createdAt: Timestamp;
}

/**
 * Fee Exemption/Waiver Record
 * For students with fee exemptions or discounts
 */
export interface FeeExemption {
  id: string;
  schoolId: string;
  studentId: string;
  feeType: 'school_fees' | 'feeding_fees' | 'books' | 'transportation' | 'uniform' | 'activity' | 'other';
  exemptionType: 'full' | 'partial' | 'scholarship';
  exemptionPercentage: number; // 0-100
  reason: string; // e.g., "Scholarship winner", "Staff child", "Sibling discount"
  approvedBy: string; // User ID of approver
  startDate: Timestamp;
  endDate?: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Fee Summary for Reporting
 * Aggregated fee data for analytics
 */
export interface FeeSummary {
  schoolId: string;
  academicYear: string;
  totalFeesExpected: number; // Total fees due for all students
  totalFeesPaid: number; // Total fees collected
  totalFeesOverdue: number; // Total outstanding/overdue
  collectionRate: number; // Percentage (0-100)
  
  // Breakdown by fee type
  feeTypeBreakdown: {
    feeType: string;
    expected: number;
    paid: number;
    pending: number;
    collectionRate: number;
  }[];
  
  // Breakdown by class
  classBreakdown: {
    className: string;
    expected: number;
    paid: number;
    pending: number;
    collectionRate: number;
  }[];
  
  generatedDate: Timestamp;
}

/**
 * Fee Report Data
 * For generating various reports
 */
export interface FeeReport {
  id: string;
  schoolId: string;
  reportType: 'collection' | 'outstanding' | 'by_class' | 'by_student' | 'by_fee_type' | 'overdue' | 'full_summary';
  academicYear: string;
  term?: string;
  reportData: any; // Dynamic based on report type
  generatedDate: Timestamp;
  generatedBy: string; // User ID
  format: 'pdf' | 'csv' | 'xlsx';
  fileUrl?: string;
  createdAt: Timestamp;
}

/**
 * Zod Validation Schemas
 */

// Fee Type Schema
export const FeeTypeSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string(),
  name: z.enum(['school_fees', 'feeding_fees', 'books', 'transportation', 'uniform', 'activity', 'other']),
  displayName: z.string().min(1, 'Display name required'),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
  frequency: z.enum(['monthly', 'termly', 'annual', 'weekly']).optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

// Class Fee Structure Schema
export const ClassFeeStructureSchema = z.object({
  id: z.string().optional(),
  classId: z.string(),
  className: z.string(),
  feeType: z.enum(['school_fees', 'feeding_fees', 'books', 'transportation', 'uniform', 'activity', 'other']),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().default('GHS'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  startDate: z.any(),
  endDate: z.any().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

// Student Fee Record Schema
export const StudentFeeRecordSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  className: z.string(),
  feeType: z.enum(['school_fees', 'feeding_fees', 'books', 'transportation', 'uniform', 'activity', 'other']),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().default('GHS'),
  dueDate: z.any(),
  term: z.string().optional(),
  academicYear: z.string(),
  paidAmount: z.number().default(0),
  pendingAmount: z.number().default(0),
  paymentStatus: z.enum(['pending', 'partial', 'paid', 'overdue', 'exempted']).default('pending'),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  lastReminderSent: z.any().optional(),
});

// Payment Record Schema
export const PaymentRecordSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string(),
  schoolId: z.string().optional(), // Deprecated
  studentId: z.string(),
  studentName: z.string(),
  feeRecordId: z.string(),
  paymentType: z.enum(['school_fees', 'feeding_fees', 'books', 'transportation', 'uniform', 'activity', 'other']),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().default('GHS'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'momo', 'card', 'cheque', 'other']),
  transactionId: z.string().optional(),
  receiptNumber: z.string(),
  recordedBy: z.string(),
  paymentDate: z.any(),
  recordedDate: z.any().optional(),
  status: z.enum(['pending', 'confirmed', 'rejected']).default('pending'),
  notes: z.string().optional(),
  approvedBy: z.string().optional(),
  approvalDate: z.any().optional(),
  receiptUrl: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

// Payment Reminder Schema
export const PaymentReminderSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string(),
  feeRecordId: z.string(),
  studentId: z.string(),
  reminderType: z.enum(['due_date', 'overdue_7days', 'overdue_30days', 'final_notice']),
  sentDate: z.any(),
  sentTo: z.string().email('Invalid email').or(z.string().regex(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/, 'Invalid phone')),
  notificationChannel: z.enum(['email', 'sms', 'in_app']),
  message: z.string(),
  read: z.boolean().default(false),
  createdAt: z.any().optional(),
});

// Fee Exemption Schema
export const FeeExemptionSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string(),
  studentId: z.string(),
  feeType: z.enum(['school_fees', 'feeding_fees', 'books', 'transportation', 'uniform', 'activity', 'other']),
  exemptionType: z.enum(['full', 'partial', 'scholarship']),
  exemptionPercentage: z.number().min(0).max(100),
  reason: z.string().min(1, 'Reason required'),
  approvedBy: z.string(),
  startDate: z.any(),
  endDate: z.any().optional(),
  notes: z.string().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

// Fee Summary Schema
export const FeeSummarySchema = z.object({
  schoolId: z.string(),
  academicYear: z.string(),
  totalFeesExpected: z.number().default(0),
  totalFeesPaid: z.number().default(0),
  totalFeesOverdue: z.number().default(0),
  collectionRate: z.number().default(0),
  feeTypeBreakdown: z.array(z.object({
    feeType: z.string(),
    expected: z.number(),
    paid: z.number(),
    pending: z.number(),
    collectionRate: z.number(),
  })).default([]),
  classBreakdown: z.array(z.object({
    className: z.string(),
    expected: z.number(),
    paid: z.number(),
    pending: z.number(),
    collectionRate: z.number(),
  })).default([]),
  generatedDate: z.any().optional(),
});

export type FeeTypeInput = z.infer<typeof FeeTypeSchema>;
export type ClassFeeStructureInput = z.infer<typeof ClassFeeStructureSchema>;
export type StudentFeeRecordInput = z.infer<typeof StudentFeeRecordSchema>;
export type PaymentRecordInput = z.infer<typeof PaymentRecordSchema>;
export type PaymentReminderInput = z.infer<typeof PaymentReminderSchema>;
export type FeeExemptionInput = z.infer<typeof FeeExemptionSchema>;
export type FeeSummaryInput = z.infer<typeof FeeSummarySchema>;
