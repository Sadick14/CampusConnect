import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

export interface SchoolClass {
  id: string;
  organizationId: string;
  className: string;
  gradeLevel: string;
  section: string;
  academicYear: string;
  capacity: number;
  currentEnrollment: number;
  classTeacherId?: string;
  classTeacherName?: string;
  subjects: ClassSubject[];
  isActive: boolean;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ClassSubject {
  subjectId: string;
  subjectName: string;
  teacherId?: string;
  teacherName?: string;
  periodsPerWeek: number;
  isActive: boolean;
}

export interface TeacherAssignment {
  id: string;
  organizationId: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  academicYear: string;
  periodsPerWeek: number;
  isActive: boolean;
  assignedBy: string;
  assignedAt: Timestamp;
  notes?: string;
}

export interface Subject {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  category: 'core' | 'elective' | 'practical';
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TimetableEntry {
  id: string;
  organizationId: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  period: number;
  startTime: string;
  endTime: string;
  room?: string;
  academicYear: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const SubjectSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string(),
  name: z.string().min(1, 'Subject name required'),
  code: z.string().min(1, 'Subject code required').toUpperCase(),
  category: z.enum(['core', 'elective', 'practical']),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export const ClassSubjectSchema = z.object({
  subjectId: z.string(),
  subjectName: z.string(),
  teacherId: z.string().optional(),
  teacherName: z.string().optional(),
  periodsPerWeek: z.number().min(1).max(20),
  isActive: z.boolean().default(true),
});

export const SchoolClassSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string(),
  className: z.string().min(1, 'Class name required'),
  gradeLevel: z.string().min(1, 'Grade level required'),
  section: z.string().min(1, 'Section required'),
  academicYear: z.string(),
  capacity: z.number().min(1).max(100),
  currentEnrollment: z.number().default(0),
  classTeacherId: z.string().optional(),
  classTeacherName: z.string().optional(),
  subjects: z.array(ClassSubjectSchema).default([]),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export const TeacherAssignmentSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string(),
  teacherId: z.string(),
  teacherName: z.string(),
  classId: z.string(),
  className: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  academicYear: z.string(),
  periodsPerWeek: z.number().min(1).max(20),
  isActive: z.boolean().default(true),
  assignedBy: z.string(),
  assignedAt: z.any().optional(),
  notes: z.string().optional(),
});

export const TimetableEntrySchema = z.object({
  id: z.string().optional(),
  organizationId: z.string(),
  classId: z.string(),
  className: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  teacherId: z.string(),
  teacherName: z.string(),
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  period: z.number().min(1).max(20),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  room: z.string().optional(),
  academicYear: z.string(),
  isActive: z.boolean().default(true),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type SubjectInput = z.infer<typeof SubjectSchema>;
export type ClassSubjectInput = z.infer<typeof ClassSubjectSchema>;
export type SchoolClassInput = z.infer<typeof SchoolClassSchema>;
export type TeacherAssignmentInput = z.infer<typeof TeacherAssignmentSchema>;
export type TimetableEntryInput = z.infer<typeof TimetableEntrySchema>;
export type Class = SchoolClass; // Alias for consistency
