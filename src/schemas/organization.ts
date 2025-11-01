import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// Zod schema for validating new organization data
export const NewOrganizationSchema = z.object({
  name: z.string().min(3, 'Organization name must be at least 3 characters long.'),
  type: z.enum(['school', 'university', 'college', 'academy', 'institute', 'other'], {
    errorMap: () => ({ message: 'Please select an organization type.' })
  }),
  description: z.string().optional(),
});
export type NewOrganizationData = z.infer<typeof NewOrganizationSchema>;

// Zod schema for updating organization profile information
export const UpdateOrganizationProfileSchema = z.object({
  name: z.string().min(3, 'Organization name must be at least 3 characters long.').optional(),
  type: z.enum(['school', 'university', 'college', 'academy', 'institute', 'other']).optional(),
  description: z.string().optional(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url('Invalid website URL.').or(z.literal('')).optional().nullable(),
});
export type UpdateOrganizationProfileData = z.infer<typeof UpdateOrganizationProfileSchema>;

/**
 * Represents an organization (school, university, etc.) in the system
 */
export interface Organization {
  /**
   * The unique identifier of the organization (Firestore document ID).
   */
  id: string;
  /**
   * The name of the organization.
   */
  name: string;
  /**
   * The type of organization (school, university, college, etc.)
   */
  type: 'school' | 'university' | 'college' | 'academy' | 'institute' | 'other';
  /**
   * Optional description of the organization.
   */
  description?: string;
  /**
   * A generated license key for the organization.
   */
  licenseKey: string;
  /**
   * The creation date of the organization record (ISO string format).
   */
  createdAt: string;
  /**
   * The last update date of the organization record (ISO string format).
   */
  updatedAt: string;
  /**
   * The user ID who owns/created this organization.
   */
  ownerId: string;
  /**
   * Email of the organization owner.
   */
  ownerEmail: string;
  /**
   * Optional physical address of the organization.
   */
  address?: string | null;
  /**
   * Optional contact phone number for the organization.
   */
  phone?: string | null;
  /**
   * Optional website URL for the organization.
   */
  website?: string | null;
  /**
   * Optional URL for the organization's logo image.
   */
  logoUrl?: string | null;
  
  // Subscription & Billing Fields
  /**
   * Current subscription status of the organization.
   */
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'locked' | 'pending_payment' | 'suspended';
  /**
   * Current subscription type/plan.
   */
  subscriptionType: 'TRIAL' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  /**
   * Trial start date (ISO string format).
   */
  trialStartDate: string;
  /**
   * Trial end date (ISO string format).
   */
  trialEndDate: string;
  /**
   * Whether the trial is currently active.
   */
  isTrialActive: boolean;
  /**
   * Number of days remaining in trial or subscription.
   */
  daysRemaining: number;
  /**
   * Subscription start date (ISO string format) - null during trial.
   */
  subscriptionStartDate?: string | null;
  /**
   * Subscription end date (ISO string format) - null during trial.
   */
  subscriptionEndDate?: string | null;
  /**
   * Next billing date (ISO string format) - null during trial.
   */
  nextBillingDate?: string | null;
  /**
   * Last payment date (ISO string format) - null if no payment made.
   */
  lastPaymentDate?: string | null;
  /**
   * Total amount paid in GHS.
   */
  totalAmountPaid: number;
  /**
   * Current payment status.
   */
  paymentStatus: 'pending' | 'approved' | 'rejected' | 'none';

  // Access Control
  /**
   * Array of user IDs who have access to this organization.
   */
  memberIds: string[];
  /**
   * Total number of members (students, staff, etc.)
   */
  memberCount: number;
}

/**
 * Represents the structure of an organization document in Firestore
 */
export interface OrganizationFirestoreDoc {
  name: string;
  type: 'school' | 'university' | 'college' | 'academy' | 'institute' | 'other';
  description?: string;
  licenseKey: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  ownerId: string;
  ownerEmail: string;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  
  // Subscription & Billing Fields
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'locked' | 'pending_payment' | 'suspended';
  subscriptionType: 'TRIAL' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  trialStartDate: Timestamp;
  trialEndDate: Timestamp;
  isTrialActive: boolean;
  daysRemaining: number;
  subscriptionStartDate?: Timestamp | null;
  subscriptionEndDate?: Timestamp | null;
  nextBillingDate?: Timestamp | null;
  lastPaymentDate?: Timestamp | null;
  totalAmountPaid: number;
  paymentStatus: 'pending' | 'approved' | 'rejected' | 'none';

  // Access Control
  memberIds: string[];
  memberCount: number;
}

/**
 * Academic Year configuration
 */
export interface AcademicYear {
  id: string;
  organizationId: string; // Updated from schoolId
  name: string; // e.g., "2024/2025"
  startDate: Timestamp;
  endDate: Timestamp;
  isCurrent: boolean;
  isActive: boolean;
  terms: AcademicTerm[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AcademicTerm {
  termNumber: number; // 1, 2, 3
  name: string; // e.g., "First Term", "Second Term"
  startDate: Timestamp;
  endDate: Timestamp;
  isCurrent: boolean;
}

export const AcademicTermSchema = z.object({
  termNumber: z.number().int().min(1).max(3),
  name: z.string().min(1),
  startDate: z.any(),
  endDate: z.any(),
  isCurrent: z.boolean().default(false),
});

export const AcademicYearSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string(), // Updated from schoolId
  name: z.string().min(1, 'Academic year name required'),
  startDate: z.any(),
  endDate: z.any(),
  isCurrent: z.boolean().default(false),
  isActive: z.boolean().default(true),
  terms: z.array(AcademicTermSchema).default([]),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type AcademicYearInput = z.infer<typeof AcademicYearSchema>;
export type AcademicTermInput = z.infer<typeof AcademicTermSchema>;
