
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore'; // If using Timestamps directly in interface

/**
 * Represents a user in the system.
 */
export interface User {
  /**
   * The unique identifier of the user (Firebase Auth UID / Firestore Doc ID).
   */
  id: string;
  /**
   * The display name of the user.
   */
  name: string; // Typically displayName
  /**
   * The email of the user.
   */
  email: string | null;
  /**
   * The role of the user (e.g., 'superadmin', 'organization_owner', 'school_admin', 'teacher', 'student').
   */
  role: 'superadmin' | 'organization_owner' | 'school_admin' | 'teacher' | 'student' | string;
  /**
   * The ID of the currently selected organization (optional). 
   */
  currentOrganizationId?: string | null;
  /**
   * Array of organization IDs that this user owns or has access to.
   */
  organizationIds?: string[];
  /**
   * Legacy: The ID of the school the user is associated with (optional). 
   * @deprecated Use organizationIds instead
   */
  schoolId?: string | null;
  /**
   * Legacy: The name of the school the user is associated with (optional, denormalized).
   * @deprecated Use organizations array instead
   */
  schoolName?: string | null;
   /**
    * Legacy: The URL of the associated school's logo (optional, denormalized).
    * @deprecated Use organizations array instead
    */
  schoolLogoUrl?: string | null;
  /**
   * ISO string representation of the creation date.
   */
  createdAt?: string; // Consider using Date object or Firestore Timestamp in some contexts
  /**
   * ISO string representation of the last update date.
   */
  updatedAt?: string; // Consider using Date object or Firestore Timestamp in some contexts
   /**
    * Optional profile photo URL.
    */
   photoURL?: string | null;
   /**
    * Optional class information for students.
    */
   class?: string | null;
   /**
    * Optional parent contact information.
    */
   parentContact?: {
     name?: string | null;
     email?: string | null;
     phone?: string | null;
   } | null;
}

// Zod schema for validating user data when created/edited by an admin
// Now includes password for creation.
export const AdminUserFormSchema = z.object({
  id: z.string().optional(), // Firestore Doc ID, present when editing.
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").optional(), // Required for creation, optional for update
  role: z.enum(['student', 'teacher', 'school_admin', 'superadmin'], {
    errorMap: () => ({ message: "Invalid role selected." })
  }),
  schoolId: z.string().optional().nullable(), // Allow null or optional string
  // Add fields specific to student role if creating/editing students here
  class: z.string().optional().nullable(),
  parentContact: z.object({
      name: z.string().optional().nullable(),
      email: z.string().email("Invalid parent email address.").or(z.literal('')).optional().nullable(), // Allow empty string or valid email
      phone: z.string().optional().nullable(),
  }).optional().nullable(),
}).refine(data => data.id || data.password, { // Password is required if ID is not present (i.e., creating)
    message: "Password is required when creating a new user.",
    path: ["password"],
}).refine(data => data.role !== 'student' || (data.role === 'student' && data.class && data.class.trim() !== ''), { // Class is required if role is student
    message: "Class/Grade is required for students.",
    path: ["class"],
});


export type AdminUserFormData = z.infer<typeof AdminUserFormSchema>;


// Interface specifically for students fetched with contact info
export interface StudentWithContact extends User {
  parentContact?: {
    email?: string | null;
    phone?: string | null;
  } | null;
}
