import { z } from 'zod';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export interface TimetableEntry {
  id: string;
  organizationId: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: DayOfWeek;
  period: number;
  startTime: string;
  endTime: string;
  room?: string;
  academicYear: string;
  term?: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface TimetableConstraints {
  // School timing
  schoolStartTime: string; // e.g., "08:00"
  schoolEndTime: string; // e.g., "15:00"
  periodDuration: number; // in minutes
  breakPeriods: { afterPeriod: number; duration: number }[];
  
  // Working days
  workingDays: DayOfWeek[];
  
  // Teacher constraints
  maxPeriodsPerDay: number;
  maxPeriodsPerWeek: number;
  minBreakBetweenClasses: number; // consecutive periods allowed
  
  // Subject constraints
  subjectPeriodsPerWeek: Record<string, number>; // subjectId -> periods
  
  // Class constraints
  maxPeriodsPerDayForClass: number;
  
  // Preferences
  avoidFirstLastPeriod?: string[]; // subjectIds to avoid in first/last period
  preferMorning?: string[]; // subjectIds that work better in morning
}

export interface GenerationParameters {
  organizationId: string;
  academicYear: string;
  term?: string;
  classIds: string[];
  constraints: TimetableConstraints;
  existingEntries?: TimetableEntry[];
  preserveExisting?: boolean;
}

export interface ConflictInfo {
  type: 'teacher_conflict' | 'room_conflict' | 'class_conflict' | 'constraint_violation';
  message: string;
  entry1?: TimetableEntry;
  entry2?: TimetableEntry;
  severity: 'error' | 'warning';
}

export interface TeacherWorkload {
  teacherId: string;
  teacherName: string;
  totalPeriods: number;
  periodsPerDay: Record<DayOfWeek, number>;
  subjects: string[];
  classes: string[];
  utilization: number; // percentage of max capacity
}

export interface AllocationResult {
  success: boolean;
  allocated: TimetableEntry[];
  conflicts: ConflictInfo[];
  unallocated: {
    classId: string;
    subjectId: string;
    reason: string;
  }[];
  warnings: string[];
}

export const TimetableEntrySchema = z.object({
  id: z.string().optional(),
  organizationId: z.string(),
  classId: z.string(),
  className: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  teacherId: z.string(),
  teacherName: z.string(),
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']),
  period: z.number().int().positive(),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().optional(),
  academicYear: z.string(),
  term: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type TimetableEntryInput = z.infer<typeof TimetableEntrySchema>;
