import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

export interface StaffMember {
  id: string;
  schoolId: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'teacher' | 'admin' | 'support_staff' | 'librarian' | 'counselor';
  department?: string | null;
  subjects?: string[];
  qualification?: string | null;
  experience?: number | null;
  salary?: number | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const StaffMemberSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  role: z.enum(['teacher', 'admin', 'support_staff', 'librarian', 'counselor']),
  department: z.string().optional().nullable(),
  subjects: z.array(z.string()).optional().default([]),
  qualification: z.string().optional().nullable(),
  experience: z.number().int().min(0).optional().nullable(),
  salary: z.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type StaffMemberInput = z.infer<typeof StaffMemberSchema>;
