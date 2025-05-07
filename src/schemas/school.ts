
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp type

// Zod schema for validating new school data including admin password for auth creation
export const NewSchoolSchema = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters long.'),
  adminEmail: z.string().email('Invalid email address for school admin.'),
  adminPassword: z.string().min(8, 'Admin password must be at least 8 characters long.'), // Added password field
});
export type NewSchoolData = z.infer<typeof NewSchoolSchema>;


// Zod schema for updating school profile information
export const UpdateSchoolProfileSchema = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters long.').optional(), // Name might be editable later
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url('Invalid website URL.').or(z.literal('')).optional().nullable(), // Allow empty string or null
  // logoUrl is handled separately via file upload
});
export type UpdateSchoolProfileData = z.infer<typeof UpdateSchoolProfileSchema>;


/**
 * Represents a school as stored and retrieved (used by services).
 */
export interface School {
  /**
   * The unique identifier of the school (Firestore document ID).
   */
  id: string;
  /**
   * The name of the school.
   */
  name: string;
  /**
   * A generated license key for the school.
   */
  licenseKey: string;
  /**
   * The creation date of the school record (ISO string format).
   */
  createdAt: string;
   /**
   * The last update date of the school record (ISO string format).
   */
  updatedAt: string;
  /**
   * Email for the school's primary admin.
   */
  adminEmail: string;
  /**
   * UID of the school's primary admin (Firebase Auth UID / Firestore user document ID).
   */
  adminUid: string; // Changed to mandatory string
  /**
   * Optional physical address of the school.
   */
  address?: string | null;
   /**
    * Optional contact phone number for the school.
    */
  phone?: string | null;
  /**
   * Optional website URL for the school.
   */
  website?: string | null;
  /**
   * Optional URL for the school's logo image stored in Firebase Storage.
   */
  logoUrl?: string | null;
}

/**
 * Represents the structure of a school document in Firestore (used internally by services).
 */
export interface SchoolFirestoreDoc {
  name: string;
  licenseKey: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  adminEmail: string;
  adminUid: string; // Firebase Auth UID
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
}
