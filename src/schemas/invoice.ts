import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type InvoiceType = 'monthly_subscription' | 'one_time' | 'custom';

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g., INV-2024-001
  organizationId: string;
  schoolName: string;
  
  // Invoice Details
  type: InvoiceType;
  description: string;
  status: InvoiceStatus;
  
  // Amount Details
  amount: number;
  currency: string; // e.g., 'GHS'
  
  // For monthly subscription invoices
  studentCount?: number;
  perStudentFee?: number;
  subscriptionPlan?: 'BASIC' | 'STANDARD' | 'PREMIUM';
  billingPeriod?: string; // e.g., 'January 2024'
  
  // Dates
  issueDate: Date | Timestamp;
  dueDate: Date | Timestamp;
  paidDate?: Date | Timestamp;
  
  // Payment Details (when paid)
  paymentMethod?: 'mobile_money' | 'bank_transfer' | 'cash' | 'cheque' | 'other';
  paymentReference?: string;
  paymentProof?: string;
  paymentNotes?: string;
  
  // Admin fields
  approvedBy?: string;
  approvedDate?: Date | Timestamp;
  
  // Timestamps
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface InvoicePayment {
  invoiceId: string;
  paymentMethod: 'mobile_money' | 'bank_transfer' | 'cash' | 'cheque' | 'other';
  paymentReference: string;
  paymentProof?: string;
  notes?: string;
}

// Zod Schemas
export const invoicePaymentSchema = z.object({
  paymentMethod: z.enum(['mobile_money', 'bank_transfer', 'cash', 'cheque', 'other']),
  paymentReference: z.string().min(5, 'Payment reference must be at least 5 characters'),
  paymentProof: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
});

export type InvoicePaymentFormValues = z.infer<typeof invoicePaymentSchema>;

// Helper function to generate invoice number
export function generateInvoiceNumber(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  return `INV-${year}${month}-${timestamp}`;
}

// Helper function to get billing period string
export function getBillingPeriod(date: Date = new Date()): string {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

// Helper function to calculate due date (e.g., 14 days from issue)
export function calculateDueDate(issueDate: Date, daysUntilDue: number = 14): Date {
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + daysUntilDue);
  return dueDate;
}

// Helper function to check if invoice is overdue
export function isInvoiceOverdue(invoice: Invoice): boolean {
  if (invoice.status === 'paid' || invoice.status === 'cancelled') {
    return false;
  }
  const dueDate = invoice.dueDate instanceof Timestamp 
    ? invoice.dueDate.toDate() 
    : new Date(invoice.dueDate);
  return new Date() > dueDate;
}
