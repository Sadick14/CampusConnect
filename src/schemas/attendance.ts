import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  organizationId: string;
  classId: string;
  className: string;
  date: Date | Timestamp;
  academicYear: string;
  term?: string;
  students: Record<string, AttendanceStatus>; // studentId -> status
  markedBy: string; // teacher/admin user ID
  markedByName: string;
  notes?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface StudentAttendance {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  date: Date | string;
}

export interface AttendanceSummary {
  studentId: string;
  studentName: string;
  className: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

// Zod schema for attendance form
export const attendanceRecordSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  date: z.string().min(1, 'Date is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  term: z.string().optional(),
  students: z.record(z.enum(['present', 'absent', 'late', 'excused'])),
  notes: z.string().optional(),
});

export type AttendanceFormValues = z.infer<typeof attendanceRecordSchema>;

// Helper function to calculate attendance rate
export function calculateAttendanceRate(present: number, totalDays: number): number {
  if (totalDays === 0) return 0;
  return Math.round((present / totalDays) * 100 * 10) / 10;
}

// Helper function to get attendance status color
export function getAttendanceStatusColor(status: AttendanceStatus): string {
  switch (status) {
    case 'present':
      return 'bg-green-500';
    case 'absent':
      return 'bg-red-500';
    case 'late':
      return 'bg-yellow-500';
    case 'excused':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
}

// Helper function to get attendance status label
export function getAttendanceStatusLabel(status: AttendanceStatus): string {
  switch (status) {
    case 'present':
      return 'Present';
    case 'absent':
      return 'Absent';
    case 'late':
      return 'Late';
    case 'excused':
      return 'Excused';
    default:
      return 'Unknown';
  }
}
