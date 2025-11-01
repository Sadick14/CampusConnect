import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  name: string;
  email: string | null;
  role: 'superadmin' | 'organization_owner' | 'teacher' | 'student' | string;
  currentOrganizationId?: string | null;
  organizationIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  photoURL?: string | null;
  class?: string | null;
  parentContact?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

export const AdminUserFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").optional(),
  role: z.enum(['student', 'teacher', 'organization_owner', 'superadmin'], {
    errorMap: () => ({ message: "Invalid role selected." })
  }),
  organizationId: z.string().optional().nullable(),
  class: z.string().optional().nullable(),
  parentContact: z.object({
      name: z.string().optional().nullable(),
      email: z.string().email("Invalid parent email address.").or(z.literal('')).optional().nullable(),
      phone: z.string().optional().nullable(),
  }).optional().nullable(),
}).refine(data => data.id || data.password, {
    message: "Password is required when creating a new user.",
    path: ["password"],
}).refine(data => data.role !== 'student' || (data.role === 'student' && data.class && data.class.trim() !== ''), {
    message: "Class/Grade is required for students.",
    path: ["class"],
});

export type AdminUserFormData = z.infer<typeof AdminUserFormSchema>;

export interface StudentWithContact extends User {
  parentContact?: {
    email?: string | null;
    phone?: string | null;
  } | null;
}
