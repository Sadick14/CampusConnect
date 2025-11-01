import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

/**
 * Class/Grade Definition
 * Represents a school class or grade level
 */
export interface SchoolClass {
  id: string;
  schoolId: string;
  className: string; // e.g., "Grade 10A", "Class 8B", "JSS 2C"
  gradeLevel: string; // e.g., "Grade 10", "JSS 2", "SSS 3"
  section: string; // e.g., "A", "B", "C" - for parallel classes
  academicYear: string; // e.g., "2024/2025"
  capacity: number; // Maximum number of students
  currentEnrollment: number; // Current number of students
  classTeacherId?: string; // ID of the main class teacher
  classTeacherName?: string; // Name of the main class teacher
  subjects: ClassSubject[]; // Subjects taught in this class
  isActive: boolean;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Subject taught in a class
 */
export interface ClassSubject {
  subjectId: string;
  subjectName: string;
  teacherId?: string; // Assigned teacher for this subject
  teacherName?: string;
  periodsPerWeek: number; // Number of periods per week
  isActive: boolean;
}

/**
 * Teacher Assignment to Class
 */
export interface TeacherAssignment {
  id: string;
  schoolId: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  academicYear: string;
  periodsPerWeek: number;
  isActive: boolean;
  assignedBy: string; // User ID who assigned
  assignedAt: Timestamp;
  notes?: string;
}

/**
 * Subject Definition
 */
export interface Subject {
  id: string;
  schoolId: string;
  name: string; // e.g., "Mathematics", "English Language"
  code: string; // e.g., "MATH", "ENG"
  category: 'core' | 'elective' | 'practical'; // Subject category
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Class Timetable Entry
 */
export interface TimetableEntry {
  id: string;
  schoolId: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  period: number; // Period number (1, 2, 3, etc.)
  startTime: string; // e.g., "08:00"
  endTime: string; // e.g., "08:45"
  room?: string; // Classroom or room number
  academicYear: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Zod Validation Schemas
 */

// Subject Schema
export const SubjectSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string(),
  name: z.string().min(1, 'Subject name required'),
  code: z.string().min(1, 'Subject code required').toUpperCase(),
  category: z.enum(['core', 'elective', 'practical']),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

// Class Subject Schema
export const ClassSubjectSchema = z.object({
  subjectId: z.string(),
  subjectName: z.string(),
  teacherId: z.string().optional(),
  teacherName: z.string().optional(),
  periodsPerWeek: z.number().min(1).max(20),
  isActive: z.boolean().default(true),
});

// School Class Schema
export const SchoolClassSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string(),
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

// Teacher Assignment Schema
export const TeacherAssignmentSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string(),
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

// Timetable Entry Schema
export const TimetableEntrySchema = z.object({
  id: z.string().optional(),
  schoolId: z.string(),
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