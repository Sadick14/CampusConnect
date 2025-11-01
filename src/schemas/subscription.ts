import { z } from 'zod';

/**
 * Subscription Pricing Model (Ghana Cedis - GHS)
 * 
 * Revenue Model:
 * - One-time upfront activation fee
 * - Monthly fee of GHS 20 per student
 * 
 * Example: School with 100 students
 * - Upfront: GHS 500
 * - Monthly: 100 students × GHS 20 = GHS 2,000/month
 */
export const SUBSCRIPTION_PLANS = {
  TRIAL: {
    name: 'Free Trial',
    duration: 30, // days
    upfrontFee: 0,
    perStudentFee: 0,
    maxStudents: 50, // Trial limited to 50 students
    features: [
      'Full access to all features',
      'Up to 50 students',
      'Basic support',
      '30 days trial period'
    ]
  },
  BASIC: {
    name: 'Basic Plan',
    upfrontFee: 300, // GHS 300 one-time activation
    perStudentFee: 20, // GHS 20 per student per month
    maxStudents: 200, // Up to 200 students
    billingCycle: 'monthly',
    features: [
      'Full access to all features',
      'Up to 200 students',
      'GHS 20 per student/month',
      'Email support',
      'Basic reporting'
    ]
  },
  STANDARD: {
    name: 'Standard Plan',
    upfrontFee: 500, // GHS 500 one-time activation
    perStudentFee: 20, // GHS 20 per student per month
    maxStudents: 500, // Up to 500 students
    billingCycle: 'monthly',
    features: [
      'Full access to all features',
      'Up to 500 students',
      'GHS 20 per student/month',
      'Priority support',
      'Advanced reporting',
      'SMS notifications'
    ]
  },
  PREMIUM: {
    name: 'Premium Plan',
    upfrontFee: 1000, // GHS 1,000 one-time activation
    perStudentFee: 20, // GHS 20 per student per month
    maxStudents: -1, // Unlimited students
    billingCycle: 'monthly',
    features: [
      'Full access to all features',
      'Unlimited students',
      'GHS 20 per student/month',
      '24/7 Priority support',
      'Advanced analytics',
      'Bulk SMS',
      'Custom branding',
      'API access',
      'Dedicated account manager'
    ]
  }
} as const;

export type SubscriptionPlanType = keyof typeof SUBSCRIPTION_PLANS;

/**
 * Subscription Status
 */
export const SubscriptionStatus = {
  TRIAL: 'trial', // In trial period
  ACTIVE: 'active', // Paid and active
  EXPIRED: 'expired', // Trial or subscription expired
  LOCKED: 'locked', // Account locked due to non-payment
  PENDING_PAYMENT: 'pending_payment', // Payment submitted, awaiting approval
  SUSPENDED: 'suspended', // Suspended by superadmin
} as const;

export type SubscriptionStatusType = typeof SubscriptionStatus[keyof typeof SubscriptionStatus];

/**
 * Payment Status
 */
export const PaymentStatus = {
  PENDING: 'pending', // Payment submitted, awaiting verification
  APPROVED: 'approved', // Payment verified and approved
  REJECTED: 'rejected', // Payment rejected
  NONE: 'none', // No payment made
} as const;

export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];

/**
 * Payment Method
 */
export const PaymentMethod = {
  MOBILE_MONEY: 'mobile_money', // MTN, Vodafone, AirtelTigo
  BANK_TRANSFER: 'bank_transfer',
  CASH: 'cash',
  CHEQUE: 'cheque',
  OTHER: 'other'
} as const;

export type PaymentMethodType = typeof PaymentMethod[keyof typeof PaymentMethod];

/**
 * Subscription Schema for Firestore
 */
export const subscriptionSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string(),
  schoolName: z.string(),
  
  // Trial Information
  trialStartDate: z.date().or(z.string()),
  trialEndDate: z.date().or(z.string()),
  isTrialActive: z.boolean().default(false),
  trialDaysRemaining: z.number().default(0),
  
  // Subscription Information
  subscriptionType: z.enum(['TRIAL', 'BASIC', 'STANDARD', 'PREMIUM']).default('TRIAL'),
  subscriptionStatus: z.enum(['trial', 'active', 'expired', 'locked', 'pending_payment', 'suspended']).default('trial'),
  subscriptionStartDate: z.date().or(z.string()).optional().nullable(),
  subscriptionEndDate: z.date().or(z.string()).optional().nullable(),
  
  // Student Count for Billing
  currentStudentCount: z.number().default(0),
  lastStudentCountUpdate: z.date().or(z.string()).optional().nullable(),
  
  // Billing Information
  upfrontFeePaid: z.boolean().default(false),
  upfrontFeeAmount: z.number().default(0),
  upfrontFeePaidAt: z.date().or(z.string()).optional().nullable(),
  nextBillingDate: z.date().or(z.string()).optional().nullable(),
  lastPaymentDate: z.date().or(z.string()).optional().nullable(),
  totalAmountPaid: z.number().default(0),
  monthlyFeeAmount: z.number().default(0), // Calculated: studentCount × perStudentFee
  
  // Current Payment
  currentPaymentStatus: z.enum(['pending', 'approved', 'rejected', 'none']).default('none'),
  currentPaymentAmount: z.number().optional().nullable(),
  currentPaymentMethod: z.enum(['mobile_money', 'bank_transfer', 'cash', 'cheque', 'other']).optional().nullable(),
  currentPaymentReference: z.string().optional().nullable(),
  currentPaymentProof: z.string().optional().nullable(), // File URL
  currentPaymentSubmittedAt: z.date().or(z.string()).optional().nullable(),
  currentPaymentNotes: z.string().optional().nullable(),
  
  // Approval Information
  approvedBy: z.string().optional().nullable(), // Superadmin user ID
  approvedAt: z.date().or(z.string()).optional().nullable(),
  approvalNotes: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  
  // Auto-lock settings
  autoLockEnabled: z.boolean().default(true),
  gracePeriodDays: z.number().default(0), // Days after expiry before locking
  
  // Timestamps
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export type Subscription = z.infer<typeof subscriptionSchema>;

/**
 * Payment Record Schema
 */
export const paymentRecordSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string(),
  schoolName: z.string(),
  
  // Payment Details
  amount: z.number().min(0),
  paymentType: z.enum(['upfront', 'monthly']).default('monthly'),
  subscriptionType: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
  studentCount: z.number().optional(), // For monthly billing
  paymentMethod: z.enum(['mobile_money', 'bank_transfer', 'cash', 'cheque', 'other']),
  paymentReference: z.string(),
  paymentProof: z.string().optional().nullable(), // File URL
  notes: z.string().optional().nullable(),
  
  // Status
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  
  // Approval/Rejection
  reviewedBy: z.string().optional().nullable(), // Superadmin user ID
  reviewedByName: z.string().optional().nullable(),
  reviewedAt: z.date().or(z.string()).optional().nullable(),
  reviewNotes: z.string().optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  
  // Billing Period
  billingStartDate: z.date().or(z.string()),
  billingEndDate: z.date().or(z.string()),
  
  // Timestamps
  submittedAt: z.date().or(z.string()),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export type PaymentRecord = z.infer<typeof paymentRecordSchema>;

/**
 * Helper function to calculate trial expiry
 */
export function calculateTrialExpiry(startDate: Date): Date {
  const expiry = new Date(startDate);
  expiry.setDate(expiry.getDate() + SUBSCRIPTION_PLANS.TRIAL.duration);
  return expiry;
}

/**
 * Helper function to calculate next billing date (30 days from start)
 */
export function calculateNextBillingDate(startDate: Date): Date {
  const nextBilling = new Date(startDate);
  nextBilling.setDate(nextBilling.getDate() + 30);
  return nextBilling;
}

/**
 * Calculate monthly fee based on student count
 */
export function calculateMonthlyFee(studentCount: number, planType: Exclude<SubscriptionPlanType, 'TRIAL'>): number {
  const plan = SUBSCRIPTION_PLANS[planType];
  return studentCount * plan.perStudentFee;
}

/**
 * Get plan details including pricing
 */
export function getPlanPricing(planType: SubscriptionPlanType, studentCount: number = 0) {
  const plan = SUBSCRIPTION_PLANS[planType];
  if (planType === 'TRIAL') {
    return {
      upfrontFee: 0,
      monthlyFee: 0,
      total: 0,
      perStudent: 0,
    };
  }
  
  const monthlyFee = studentCount * plan.perStudentFee;
  return {
    upfrontFee: plan.upfrontFee,
    monthlyFee,
    perStudent: plan.perStudentFee,
    total: monthlyFee, // Upfront is one-time
  };
}

/**
 * Helper function to get days remaining
 */
export function getDaysRemaining(endDate: Date): number {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Helper function to check if trial/subscription is expired
 */
export function isExpired(endDate: Date): boolean {
  return getDaysRemaining(endDate) <= 0;
}

/**
 * Helper function to format GHS currency
 */
export function formatGHS(amount: number): string {
  return `GHS ${amount.toFixed(2)}`;
}
