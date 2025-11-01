import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

/**
 * Comprehensive Student Address Information
 */
export interface StudentAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  homePhone?: string | null;
}

/**
 * Guardian/Parent Information
 */
export interface Guardian {
  name: string;
  relationship: 'parent' | 'guardian' | 'other';
  email: string;
  phone: string;
  occupation?: string | null;
  address?: StudentAddress | null;
  isEmergencyContact?: boolean;
}

/**
 * Medical and Health Information
 */
export interface MedicalInfo {
  bloodGroup?: string | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  medicationsRequired?: string | null;
  emergencyMedicalInfo?: string | null;
  insuranceProvider?: string | null;
  insurancePolicyNumber?: string | null;
}

/**
 * Academic Information
 */
export interface AcademicInfo {
  admissionDate: string;
  admissionNumber: string;
  previousSchool?: string | null;
  previousClass?: string | null;
  transferCertificateNumber?: string | null;
  nclmLevel?: string | null;
}

/**
 * Complete Student Interface
 */
export interface Student {
  // Basic Information
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date format
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  studentIdNumber: string; // Unique ID within school
  email?: string | null;
  phone?: string | null;

  // Current Academic Details
  currentClass: string;
  section?: string | null;
  rollNumber?: string | null;
  admissionNumber: string;

  // Contact Information
  address: StudentAddress;

  // Guardian Information
  guardians: Guardian[]; // Primary and secondary guardians

  // Medical Information
  medicalInfo?: MedicalInfo | null;

  // Academic History
  academicHistory?: AcademicInfo | null;

  // Document URLs
  profilePhotoUrl?: string | null;
  admissionFormUrl?: string | null;
  birthCertificateUrl?: string | null;
  transferCertificateUrl?: string | null;

  // Status and Enrollment
  status: 'active' | 'inactive' | 'graduated' | 'transferred' | 'suspended';
  enrollmentDate: string;
  withdrawalDate?: string | null;
  withdrawalReason?: string | null;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  notes?: string | null;
}

/**
 * Firestore representation of Student
 */
export interface StudentFirestoreDoc {
  // Basic Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  studentIdNumber: string;
  email?: string | null;
  phone?: string | null;

  // Current Academic Details
  currentClass: string;
  section?: string | null;
  rollNumber?: string | null;
  admissionNumber: string;

  // Contact Information
  address: StudentAddress;

  // Guardian Information
  guardians: Guardian[];

  // Medical Information
  medicalInfo?: MedicalInfo | null;

  // Academic History
  academicHistory?: AcademicInfo | null;

  // Document URLs
  profilePhotoUrl?: string | null;
  admissionFormUrl?: string | null;
  birthCertificateUrl?: string | null;
  transferCertificateUrl?: string | null;

  // Status and Enrollment
  status: 'active' | 'inactive' | 'graduated' | 'transferred' | 'suspended';
  enrollmentDate: Timestamp;
  withdrawalDate?: Timestamp | null;
  withdrawalReason?: string | null;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string | null;
  notes?: string | null;
  schoolId: string;
}

// Zod schemas for validation

export const StudentAddressSchema = z.object({
  street: z.string().min(3, 'Street address must be at least 3 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  postalCode: z.string().min(2, 'Postal code must be at least 2 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  homePhone: z.string().optional().nullable(),
});

export const GuardianSchema = z.object({
  name: z.string().min(2, 'Guardian name must be at least 2 characters'),
  relationship: z.enum(['parent', 'guardian', 'other']),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  occupation: z.string().optional().nullable(),
  address: StudentAddressSchema.optional().nullable(),
  isEmergencyContact: z.boolean().optional(),
});

export const MedicalInfoSchema = z.object({
  bloodGroup: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  chronicConditions: z.string().optional().nullable(),
  medicationsRequired: z.string().optional().nullable(),
  emergencyMedicalInfo: z.string().optional().nullable(),
  insuranceProvider: z.string().optional().nullable(),
  insurancePolicyNumber: z.string().optional().nullable(),
});

export const AcademicInfoSchema = z.object({
  admissionDate: z.string(),
  admissionNumber: z.string(),
  previousSchool: z.string().optional().nullable(),
  previousClass: z.string().optional().nullable(),
  transferCertificateNumber: z.string().optional().nullable(),
  nclmLevel: z.string().optional().nullable(),
});

// Student Registration Form Schema (for multi-step form)
export const StudentPersonalInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
});

export const StudentAcademicDetailsSchema = z.object({
  currentClass: z.string().min(1, 'Class is required'),
  section: z.string().optional().nullable(),
  rollNumber: z.string().optional().nullable(),
  admissionNumber: z.string().min(1, 'Admission number is required'),
  admissionDate: z.string(),
  previousSchool: z.string().optional().nullable(),
  previousClass: z.string().optional().nullable(),
});

export const StudentContactInfoSchema = z.object({
  street: z.string().min(3, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(2, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  homePhone: z.string().optional().nullable(),
});

export const PrimaryGuardianSchema = z.object({
  name: z.string().min(2, 'Guardian name is required'),
  relationship: z.enum(['parent', 'guardian', 'other']),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  occupation: z.string().optional().nullable(),
  isEmergencyContact: z.boolean().optional().default(true),
});

export const SecondaryGuardianSchema = z.object({
  name: z.string().min(2, 'Guardian name is required'),
  relationship: z.enum(['parent', 'guardian', 'other']),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  occupation: z.string().optional().nullable(),
  isEmergencyContact: z.boolean().optional().default(false),
}).optional();

export const StudentMedicalInfoSchema = z.object({
  bloodGroup: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  chronicConditions: z.string().optional().nullable(),
  medicationsRequired: z.string().optional().nullable(),
  emergencyMedicalInfo: z.string().optional().nullable(),
  insuranceProvider: z.string().optional().nullable(),
  insurancePolicyNumber: z.string().optional().nullable(),
});

// Complete registration form schema (combines all steps)
export const StudentRegistrationSchema = z.object({
  // Personal Info
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),

  // Academic Details
  currentClass: z.string().min(1, 'Class is required'),
  section: z.string().optional().nullable(),
  rollNumber: z.string().optional().nullable(),
  admissionNumber: z.string().min(1, 'Admission number is required'),
  admissionDate: z.string(),
  previousSchool: z.string().optional().nullable(),
  previousClass: z.string().optional().nullable(),

  // Contact Address
  street: z.string().min(3, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(2, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  homePhone: z.string().optional().nullable(),

  // Primary Guardian
  guardianName: z.string().min(2, 'Guardian name is required'),
  guardianRelationship: z.enum(['parent', 'guardian', 'other']),
  guardianEmail: z.string().email('Invalid email address'),
  guardianPhone: z.string().min(10, 'Valid phone is required'),
  guardianOccupation: z.string().optional().nullable(),

  // Secondary Guardian (Optional)
  secondaryGuardianName: z.string().optional().nullable(),
  secondaryGuardianRelationship: z.enum(['parent', 'guardian', 'other']).optional(),
  secondaryGuardianEmail: z.string().email().optional().nullable(),
  secondaryGuardianPhone: z.string().optional().nullable(),

  // Medical Information
  bloodGroup: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  chronicConditions: z.string().optional().nullable(),
  medicationsRequired: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type StudentRegistrationData = z.infer<typeof StudentRegistrationSchema>;
export type StudentPersonalInfoData = z.infer<typeof StudentPersonalInfoSchema>;
export type StudentAcademicDetailsData = z.infer<typeof StudentAcademicDetailsSchema>;
export type StudentContactInfoData = z.infer<typeof StudentContactInfoSchema>;
export type PrimaryGuardianData = z.infer<typeof PrimaryGuardianSchema>;
export type StudentMedicalInfoData = z.infer<typeof StudentMedicalInfoSchema>;
