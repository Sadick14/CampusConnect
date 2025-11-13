'use server';

/**
 * @fileOverview Comprehensive timetable generation and management service
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase-server';

export interface TimetableEntry {
  id: string;
  organizationId: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: string;
  period: number;
  startTime: string;
  endTime: string;
  room?: string;
  academicYear: string;
  term?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimetableConflict {
  type: 'teacher_conflict' | 'class_conflict' | 'room_conflict' | 'workload_exceeded';
  message: string;
  severity: 'error' | 'warning';
  entries: TimetableEntry[];
}

export interface TimetableValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: TimetableConflict[];
}

// ============================================================================
// Enhanced Configuration Types
// ============================================================================

export type TeacherType = 'class_teacher' | 'subject_teacher';
export type ActivityType = 'subject' | 'pe' | 'cocurricular' | 'assembly' | 'break' | 'lunch';

export interface TeacherConfig {
  id: string;
  name: string;
  type: TeacherType; // Class teacher or subject teacher
  subjects: string[]; // Subjects this teacher can teach
  classIds?: string[]; // For class teachers - classes they handle
  maxPeriodsPerDay: number; // Maximum periods per day
  maxPeriodsPerWeek: number; // Maximum periods per week
  preferredDays?: string[]; // Days teacher is available
  unavailablePeriods?: { day: string; period: number }[]; // Specific slots teacher is unavailable
}

export interface SubjectConfig {
  id: string;
  name: string;
  periodsPerWeek: number; // Total periods needed per week
  occursDaily?: boolean; // Should appear every day (e.g., Mathematics)
  minPeriodsPerDay?: number; // Minimum periods per day if it occurs
  maxPeriodsPerDay?: number; // Maximum periods per day
  preferMorning?: boolean; // Should be scheduled in morning slots
  requiresDoublePeriod?: boolean; // Needs consecutive periods (e.g., Lab work)
  category: ActivityType; // Type of activity
}

export interface ClassConfig {
  id: string;
  name: string;
  teachingType: 'class_teacher' | 'subject_based'; // All subjects by one teacher or different teachers
  classTeacherId?: string; // If class teacher model
  subjects: string[]; // Subject IDs for this class
  studentCount?: number; // For room allocation
}

export interface TimetableConfiguration {
  organizationId: string;
  academicYear: string;
  term?: string;
  
  // School-wide settings
  workingDays: string[]; // e.g., ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  periodsPerDay: number; // Total periods in a day
  periodDuration: number; // Minutes per period
  schoolStartTime: string; // HH:MM format
  schoolEndTime: string; // HH:MM format
  
  // Break configuration
  breaks: {
    name: string; // e.g., 'Short Break', 'Lunch Break'
    afterPeriod: number; // After which period
    duration: number; // Minutes
    type: 'break' | 'lunch' | 'assembly';
  }[];
  
  // Teachers configuration
  teachers: TeacherConfig[];
  totalTeachers: number;
  
  // Classes configuration
  classes: ClassConfig[];
  
  // Subjects configuration
  subjects: SubjectConfig[];
  
  // Special activities
  specialActivities?: {
    name: string; // e.g., 'Physical Education', 'Assembly'
    type: ActivityType;
    frequency: 'daily' | 'weekly' | 'biweekly'; // How often
    duration: number; // Number of periods
    preferredDay?: string; // e.g., 'Monday' for assembly
    preferredPeriod?: number; // Specific period if needed
    affectsAllClasses: boolean; // True for assembly, false for PE
  }[];
  
  // Room configuration
  rooms?: {
    id: string;
    name: string;
    capacity: number;
    type?: string; // 'classroom', 'lab', 'hall', 'gym'
  }[];
  
  // Constraints and preferences
  constraints: {
    avoidConsecutiveSameSubject: boolean;
    distributeSubjectsEvenly: boolean; // Spread subjects across the week
    maxConsecutivePeriods: number; // Max same subject in a row
    allowGaps: boolean; // Allow free periods between classes
    prioritizeTeacherPreferences: boolean;
  };
}

export interface GenerationResult {
  success: boolean;
  entries: TimetableEntry[];
  conflicts: TimetableConflict[];
  warnings: string[];
  statistics: {
    totalPeriodsAllocated: number;
    totalPeriodsRequested: number;
    teacherUtilization: { teacherId: string; teacherName: string; periodsAllocated: number; maxPeriods: number }[];
    unallocatedSubjects: { classId: string; subjectId: string; reason: string }[];
  };
}

export interface TeacherInfo {
  id: string;
  name: string;
  subjects: string[];
  maxPeriodsPerDay?: number;
  maxPeriodsPerWeek?: number;
}

export interface SubjectInfo {
  id: string;
  name: string;
  periodsPerWeek: number;
}

export interface TimetableGenerationParams {
  organizationId: string;
  classId: string;
  subjects: SubjectInfo[];
  teachers: TeacherInfo[];
  periodsPerDay: number;
  periodDuration: number;
  startTime: string;
  breakAfterPeriod?: number;
  breakDuration?: number;
  lunchAfterPeriod?: number;
  lunchDuration?: number;
  workingDays: string[];
  avoidConsecutiveSameSubject?: boolean;
  distributeEvenly?: boolean;
  academicYear: string;
  term?: string;
}

const COLLECTION = 'timetables';

export async function getTimetableEntries(
  organizationId: string,
  filters?: {
    classId?: string;
    teacherId?: string;
    dayOfWeek?: string;
    academicYear?: string;
    term?: string;
  }
): Promise<TimetableEntry[]> {
  try {
    const db = getDb();
    let q = query(
      collection(db, COLLECTION),
      where('organizationId', '==', organizationId)
    );

    const snapshot = await getDocs(q);
    let entries = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as TimetableEntry;
    });

    if (filters) {
      if (filters.classId) {
        entries = entries.filter(e => e.classId === filters.classId);
      }
      if (filters.teacherId) {
        entries = entries.filter(e => e.teacherId === filters.teacherId);
      }
      if (filters.dayOfWeek) {
        entries = entries.filter(e => e.dayOfWeek === filters.dayOfWeek);
      }
      if (filters.academicYear) {
        entries = entries.filter(e => e.academicYear === filters.academicYear);
      }
      if (filters.term) {
        entries = entries.filter(e => e.term === filters.term);
      }
    }

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    entries.sort((a, b) => {
      const dayA = dayOrder.indexOf(a.dayOfWeek);
      const dayB = dayOrder.indexOf(b.dayOfWeek);
      if (dayA !== dayB) return dayA - dayB;
      return a.period - b.period;
    });

    return entries;
  } catch (error: any) {
    console.error('Error fetching timetable entries:', error);
    throw new Error(`Failed to fetch timetable entries: ${error.message}`);
  }
}

export async function createTimetableEntry(
  entry: Omit<TimetableEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TimetableEntry> {
  try {
    const db = getDb();
    
    const entryData = {
      ...entry,
      isActive: entry.isActive ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTION), entryData);
    
    const created = await getDoc(docRef);
    const data = created.data();
    
    return {
      id: docRef.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as TimetableEntry;
  } catch (error: any) {
    console.error('Error creating timetable entry:', error);
    throw new Error(`Failed to create timetable entry: ${error.message}`);
  }
}

export async function updateTimetableEntry(
  id: string,
  updates: Partial<Omit<TimetableEntry, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<TimetableEntry> {
  try {
    const db = getDb();
    const docRef = doc(db, COLLECTION, id);

    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    const updated = await getDoc(docRef);
    const data = updated.data();

    return {
      id,
      ...data,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as TimetableEntry;
  } catch (error: any) {
    console.error('Error updating timetable entry:', error);
    throw new Error(`Failed to update timetable entry: ${error.message}`);
  }
}

export async function deleteTimetableEntry(id: string): Promise<void> {
  try {
    const db = getDb();
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error: any) {
    console.error('Error deleting timetable entry:', error);
    throw new Error(`Failed to delete timetable entry: ${error.message}`);
  }
}

export async function checkConflicts(
  organizationId: string,
  entries: TimetableEntry[]
): Promise<TimetableConflict[]> {
  const conflicts: TimetableConflict[] = [];

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const e1 = entries[i];
      const e2 = entries[j];

      if (e1.dayOfWeek === e2.dayOfWeek && e1.period === e2.period) {
        if (e1.teacherId === e2.teacherId) {
          conflicts.push({
            type: 'teacher_conflict',
            message: `Teacher ${e1.teacherName} is scheduled for both ${e1.subjectName} (${e1.className}) and ${e2.subjectName} (${e2.className}) at the same time`,
            severity: 'error',
            entries: [e1, e2],
          });
        }

        if (e1.classId === e2.classId) {
          conflicts.push({
            type: 'class_conflict',
            message: `Class ${e1.className} has both ${e1.subjectName} and ${e2.subjectName} scheduled at the same time`,
            severity: 'error',
            entries: [e1, e2],
          });
        }

        if (e1.room && e2.room && e1.room === e2.room) {
          conflicts.push({
            type: 'room_conflict',
            message: `Room ${e1.room} is double-booked for ${e1.className} and ${e2.className}`,
            severity: 'warning',
            entries: [e1, e2],
          });
        }
      }
    }
  }

  return conflicts;
}

export async function validateTimetable(
  organizationId: string,
  entries: TimetableEntry[]
): Promise<TimetableValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const conflicts = await checkConflicts(organizationId, entries);

  entries.forEach(entry => {
    if (!entry.classId || !entry.subjectId || !entry.teacherId) {
      errors.push(`Entry ${entry.id} is missing required fields`);
    }
    if (entry.period < 1) {
      errors.push(`Entry ${entry.id} has invalid period number: ${entry.period}`);
    }
  });

  const teacherWorkload = new Map<string, number>();
  entries.forEach(entry => {
    const count = teacherWorkload.get(entry.teacherId) || 0;
    teacherWorkload.set(entry.teacherId, count + 1);
  });

  teacherWorkload.forEach((count, teacherId) => {
    if (count > 30) {
      warnings.push(`Teacher ${teacherId} has ${count} periods per week (exceeds recommended limit of 30)`);
    }
  });

  return {
    isValid: errors.length === 0 && conflicts.filter(c => c.severity === 'error').length === 0,
    errors,
    warnings,
    conflicts,
  };
}

export async function generateTimetable(
  params: TimetableGenerationParams
): Promise<TimetableEntry[]> {
  try {
    const {
      organizationId,
      classId,
      subjects,
      teachers,
      periodsPerDay,
      periodDuration,
      startTime,
      breakAfterPeriod,
      breakDuration,
      lunchAfterPeriod,
      lunchDuration,
      workingDays,
      avoidConsecutiveSameSubject,
      distributeEvenly,
      academicYear,
      term,
    } = params;

    const existing = await getTimetableEntries(organizationId, { classId, academicYear });
    const db = getDb();
    if (existing.length > 0) {
      const batch = writeBatch(db);
      existing.forEach(entry => {
        batch.delete(doc(db, COLLECTION, entry.id));
      });
      await batch.commit();
    }

    const generated: TimetableEntry[] = [];
    const schedule = new Map<string, string>();
    const totalSlots = workingDays.length * periodsPerDay;
    const totalPeriodsNeeded = subjects.reduce((sum, s) => sum + s.periodsPerWeek, 0);

    if (totalPeriodsNeeded > totalSlots) {
      throw new Error(
        `Not enough slots: ${totalPeriodsNeeded} periods needed but only ${totalSlots} available`
      );
    }

    for (const subject of subjects) {
      let periodsAllocated = 0;
      const periodsNeeded = subject.periodsPerWeek;

      const teacher = teachers.find(t => 
        t.subjects.some(s => s.toLowerCase() === subject.name.toLowerCase())
      );

      if (!teacher) {
        console.warn(`No teacher found for subject: ${subject.name}`);
        continue;
      }

      const periodsPerDayForSubject = distributeEvenly
        ? Math.ceil(periodsNeeded / workingDays.length)
        : periodsNeeded;

      for (const day of workingDays) {
        if (periodsAllocated >= periodsNeeded) break;

        let dailyCount = 0;
        let lastPeriod: number | null = null;

        for (let period = 1; period <= periodsPerDay; period++) {
          if (periodsAllocated >= periodsNeeded) break;
          if (distributeEvenly && dailyCount >= periodsPerDayForSubject) break;

          const slotKey = `${day}_${period}`;
          if (schedule.has(slotKey)) continue;

          if (avoidConsecutiveSameSubject && lastPeriod === period - 1) {
            continue;
          }

          // Convert old break parameters to new format
          const breaks = [];
          if (breakAfterPeriod && breakDuration) {
            breaks.push({ name: 'Short Break', afterPeriod: breakAfterPeriod, duration: breakDuration, type: 'break' as const });
          }
          if (lunchAfterPeriod && lunchDuration) {
            breaks.push({ name: 'Lunch', afterPeriod: lunchAfterPeriod, duration: lunchDuration, type: 'lunch' as const });
          }

          const times = calculatePeriodTimes(
            period,
            startTime,
            periodDuration,
            breaks
          );

          const entry: TimetableEntry = {
            id: '',
            organizationId,
            classId,
            className: '',
            subjectId: subject.id,
            subjectName: subject.name,
            teacherId: teacher.id,
            teacherName: teacher.name,
            dayOfWeek: day,
            period,
            startTime: times.startTime,
            endTime: times.endTime,
            academicYear,
            term,
            isActive: true,
          };

          generated.push(entry);
          schedule.set(slotKey, subject.id);
          periodsAllocated++;
          dailyCount++;
          lastPeriod = period;
        }
      }

      if (periodsAllocated < periodsNeeded) {
        console.warn(
          `Could not allocate all periods for ${subject.name}: ${periodsAllocated}/${periodsNeeded}`
        );
      }
    }

    const batch = writeBatch(db);
    const now = Timestamp.now();
    
    generated.forEach(entry => {
      const docRef = doc(collection(db, COLLECTION));
      const { id, ...entryData } = entry;
      batch.set(docRef, {
        ...entryData,
        createdAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();
    return generated;
  } catch (error: any) {
    console.error('Error generating timetable:', error);
    throw new Error(`Failed to generate timetable: ${error.message}`);
  }
}

// ============================================================================
// Comprehensive Timetable Generation with Full Configuration
// ============================================================================

/**
 * Generate comprehensive timetable for all classes based on full configuration
 */
export async function generateComprehensiveTimetable(
  config: TimetableConfiguration
): Promise<GenerationResult> {
  try {
    const {
      organizationId,
      academicYear,
      term,
      workingDays,
      periodsPerDay,
      periodDuration,
      schoolStartTime,
      breaks,
      teachers,
      classes,
      subjects,
      specialActivities,
      constraints,
    } = config;

    const allEntries: TimetableEntry[] = [];
    const allConflicts: TimetableConflict[] = [];
    const allWarnings: string[] = [];
    const unallocatedSubjects: { classId: string; subjectId: string; reason: string }[] = [];
    const teacherWorkload = new Map<string, number>();

    // Initialize teacher workload tracking
    teachers.forEach(t => teacherWorkload.set(t.id, 0));

    // Calculate available slots per day (excluding breaks)
    const totalSlotsPerDay = periodsPerDay;

    // Process each class
    for (const classConfig of classes) {
      const classSchedule = new Map<string, TimetableEntry>(); // key: "day_period"

      // Get subjects for this class
      const classSubjects = subjects.filter(s => classConfig.subjects.includes(s.id));

      // Handle special activities first (they have fixed slots)
      if (specialActivities) {
        for (const activity of specialActivities) {
          if (activity.affectsAllClasses || classConfig.subjects.includes(activity.name)) {
            if (activity.preferredDay && activity.preferredPeriod) {
              const slotKey = `${activity.preferredDay}_${activity.preferredPeriod}`;
              
              const times = calculatePeriodTimes(
                activity.preferredPeriod,
                schoolStartTime,
                periodDuration,
                breaks
              );

              const entry: TimetableEntry = {
                id: '',
                organizationId,
                classId: classConfig.id,
                className: classConfig.name,
                subjectId: activity.name.toLowerCase().replace(/\s+/g, '_'),
                subjectName: activity.name,
                teacherId: 'special_activity',
                teacherName: 'Special Activity',
                dayOfWeek: activity.preferredDay,
                period: activity.preferredPeriod,
                startTime: times.startTime,
                endTime: times.endTime,
                academicYear,
                term,
                isActive: true,
              };

              classSchedule.set(slotKey, entry);
              allEntries.push(entry);
            }
          }
        }
      }

      // Determine teaching model for this class
      if (classConfig.teachingType === 'class_teacher' && classConfig.classTeacherId) {
        // Class teacher handles all subjects
        const classTeacher = teachers.find(t => t.id === classConfig.classTeacherId);
        
        if (!classTeacher) {
          allWarnings.push(`Class teacher not found for ${classConfig.name}`);
          continue;
        }

        // Allocate all subjects to class teacher
        for (const subject of classSubjects) {
          const allocated = await allocateSubjectPeriods(
            subject,
            classConfig,
            classTeacher,
            classSchedule,
            workingDays,
            periodsPerDay,
            schoolStartTime,
            periodDuration,
            breaks,
            constraints,
            organizationId,
            academicYear,
            term
          );

          allEntries.push(...allocated.entries);
          teacherWorkload.set(classTeacher.id, (teacherWorkload.get(classTeacher.id) || 0) + allocated.entries.length);

          if (allocated.entries.length < subject.periodsPerWeek) {
            unallocatedSubjects.push({
              classId: classConfig.id,
              subjectId: subject.id,
              reason: `Only allocated ${allocated.entries.length} of ${subject.periodsPerWeek} periods`,
            });
          }
        }
      } else {
        // Subject-based teaching - different teachers for different subjects
        for (const subject of classSubjects) {
          // Find suitable teacher for this subject
          const suitableTeachers = teachers.filter(t => 
            t.type === 'subject_teacher' && 
            t.subjects.includes(subject.name) &&
            (teacherWorkload.get(t.id) || 0) < t.maxPeriodsPerWeek
          );

          if (suitableTeachers.length === 0) {
            unallocatedSubjects.push({
              classId: classConfig.id,
              subjectId: subject.id,
              reason: `No available teacher found for ${subject.name}`,
            });
            continue;
          }

          // Select teacher with lowest workload
          const selectedTeacher = suitableTeachers.reduce((prev, curr) => 
            (teacherWorkload.get(curr.id) || 0) < (teacherWorkload.get(prev.id) || 0) ? curr : prev
          );

          const allocated = await allocateSubjectPeriods(
            subject,
            classConfig,
            selectedTeacher,
            classSchedule,
            workingDays,
            periodsPerDay,
            schoolStartTime,
            periodDuration,
            breaks,
            constraints,
            organizationId,
            academicYear,
            term
          );

          allEntries.push(...allocated.entries);
          teacherWorkload.set(selectedTeacher.id, (teacherWorkload.get(selectedTeacher.id) || 0) + allocated.entries.length);

          if (allocated.entries.length < subject.periodsPerWeek) {
            unallocatedSubjects.push({
              classId: classConfig.id,
              subjectId: subject.id,
              reason: `Only allocated ${allocated.entries.length} of ${subject.periodsPerWeek} periods`,
            });
          }
        }
      }
    }

    // Check for conflicts
    const conflicts = await checkConflicts(organizationId, allEntries);

    // Calculate statistics
    const teacherUtilization = teachers.map(t => ({
      teacherId: t.id,
      teacherName: t.name,
      periodsAllocated: teacherWorkload.get(t.id) || 0,
      maxPeriods: t.maxPeriodsPerWeek,
    }));

    const totalPeriodsRequested = classes.reduce((sum, cls) => {
      const classSubjects = subjects.filter(s => cls.subjects.includes(s.id));
      return sum + classSubjects.reduce((subSum, sub) => subSum + sub.periodsPerWeek, 0);
    }, 0);

    // Save to database
    if (allEntries.length > 0) {
      const db = getDb();
      const batch = writeBatch(db);
      const now = Timestamp.now();

      // Delete existing entries for this academic year
      const existing = await getTimetableEntries(organizationId, { academicYear });
      existing.forEach(entry => {
        batch.delete(doc(db, COLLECTION, entry.id));
      });

      // Add new entries
      allEntries.forEach(entry => {
        const docRef = doc(collection(db, COLLECTION));
        const { id, ...entryData } = entry;
        batch.set(docRef, {
          ...entryData,
          createdAt: now,
          updatedAt: now,
        });
      });

      await batch.commit();
    }

    return {
      success: unallocatedSubjects.length === 0 && conflicts.filter(c => c.severity === 'error').length === 0,
      entries: allEntries,
      conflicts,
      warnings: allWarnings,
      statistics: {
        totalPeriodsAllocated: allEntries.length,
        totalPeriodsRequested,
        teacherUtilization,
        unallocatedSubjects,
      },
    };
  } catch (error: any) {
    console.error('Error generating comprehensive timetable:', error);
    throw new Error(`Failed to generate comprehensive timetable: ${error.message}`);
  }
}

/**
 * Allocate periods for a specific subject to a class
 */
async function allocateSubjectPeriods(
  subject: SubjectConfig,
  classConfig: ClassConfig,
  teacher: TeacherConfig,
  classSchedule: Map<string, TimetableEntry>,
  workingDays: string[],
  periodsPerDay: number,
  schoolStartTime: string,
  periodDuration: number,
  breaks: TimetableConfiguration['breaks'],
  constraints: TimetableConfiguration['constraints'],
  organizationId: string,
  academicYear: string,
  term?: string
): Promise<{ entries: TimetableEntry[]; conflicts: TimetableConflict[] }> {
  const entries: TimetableEntry[] = [];
  const conflicts: TimetableConflict[] = [];
  let periodsAllocated = 0;
  const periodsNeeded = subject.periodsPerWeek;

  // Determine daily distribution
  const daysNeeded = subject.occursDaily ? workingDays.length : Math.ceil(periodsNeeded / (subject.maxPeriodsPerDay || 2));
  const periodsPerDayTarget = subject.occursDaily ? 1 : Math.ceil(periodsNeeded / daysNeeded);

  for (const day of workingDays) {
    if (periodsAllocated >= periodsNeeded) break;

    // Check if teacher is available on this day
    if (teacher.preferredDays && !teacher.preferredDays.includes(day)) {
      continue;
    }

    let dailyCount = 0;
    let lastAllocatedPeriod: number | null = null;

    // Determine period range based on preferences
    const periodStart = subject.preferMorning ? 1 : 1;
    const periodEnd = subject.preferMorning ? Math.ceil(periodsPerDay / 2) : periodsPerDay;

    for (let period = periodStart; period <= periodEnd; period++) {
      if (periodsAllocated >= periodsNeeded) break;
      if (dailyCount >= periodsPerDayTarget) break;

      const slotKey = `${day}_${period}`;

      // Check if slot is already taken
      if (classSchedule.has(slotKey)) continue;

      // Check teacher unavailability
      if (teacher.unavailablePeriods?.some(up => up.day === day && up.period === period)) {
        continue;
      }

      // Check constraints
      if (constraints.avoidConsecutiveSameSubject && lastAllocatedPeriod === period - 1) {
        if (dailyCount > 0 && !subject.requiresDoublePeriod) continue;
      }

      // Calculate times
      const times = calculatePeriodTimes(period, schoolStartTime, periodDuration, breaks);

      // Create entry
      const entry: TimetableEntry = {
        id: '',
        organizationId,
        classId: classConfig.id,
        className: classConfig.name,
        subjectId: subject.id,
        subjectName: subject.name,
        teacherId: teacher.id,
        teacherName: teacher.name,
        dayOfWeek: day,
        period,
        startTime: times.startTime,
        endTime: times.endTime,
        academicYear,
        term,
        isActive: true,
      };

      entries.push(entry);
      classSchedule.set(slotKey, entry);
      periodsAllocated++;
      dailyCount++;
      lastAllocatedPeriod = period;

      // If requires double period, try to allocate next period too
      if (subject.requiresDoublePeriod && periodsAllocated < periodsNeeded && period < periodEnd) {
        const nextPeriod = period + 1;
        const nextSlotKey = `${day}_${nextPeriod}`;
        
        if (!classSchedule.has(nextSlotKey)) {
          const nextTimes = calculatePeriodTimes(nextPeriod, schoolStartTime, periodDuration, breaks);
          
          const nextEntry: TimetableEntry = {
            id: '',
            organizationId,
            classId: classConfig.id,
            className: classConfig.name,
            subjectId: subject.id,
            subjectName: subject.name,
            teacherId: teacher.id,
            teacherName: teacher.name,
            dayOfWeek: day,
            period: nextPeriod,
            startTime: nextTimes.startTime,
            endTime: nextTimes.endTime,
            academicYear,
            term,
            isActive: true,
          };

          entries.push(nextEntry);
          classSchedule.set(nextSlotKey, nextEntry);
          periodsAllocated++;
          dailyCount++;
          lastAllocatedPeriod = nextPeriod;
        }
      }
    }
  }

  return { entries, conflicts };
}

/**
 * Calculate period times with break consideration
 */
function calculatePeriodTimes(
  period: number,
  schoolStartTime: string,
  periodDuration: number,
  breaks: TimetableConfiguration['breaks']
): { startTime: string; endTime: string } {
  const [startHour, startMin] = schoolStartTime.split(':').map(Number);
  let totalMinutes = startHour * 60 + startMin;

  // Add duration of previous periods
  totalMinutes += (period - 1) * periodDuration;

  // Add break times
  breaks.forEach(breakConfig => {
    if (period > breakConfig.afterPeriod) {
      totalMinutes += breakConfig.duration;
    }
  });

  const startH = Math.floor(totalMinutes / 60);
  const startM = totalMinutes % 60;
  const periodStartTime = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;

  totalMinutes += periodDuration;
  const endH = Math.floor(totalMinutes / 60);
  const endM = totalMinutes % 60;
  const periodEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  return { startTime: periodStartTime, endTime: periodEndTime };
}

/**
 * Save timetable configuration for future reference
 */
export async function saveTimetableConfiguration(
  config: TimetableConfiguration
): Promise<string> {
  try {
    const db = getDb();
    const configRef = await addDoc(collection(db, 'timetableConfigurations'), {
      ...config,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return configRef.id;
  } catch (error: any) {
    console.error('Error saving timetable configuration:', error);
    throw new Error(`Failed to save configuration: ${error.message}`);
  }
}

/**
 * Get saved timetable configuration
 */
export async function getTimetableConfiguration(
  organizationId: string,
  academicYear: string
): Promise<TimetableConfiguration | null> {
  try {
    const db = getDb();
    const q = query(
      collection(db, 'timetableConfigurations'),
      where('organizationId', '==', organizationId),
      where('academicYear', '==', academicYear)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { ...doc.data() } as TimetableConfiguration;
  } catch (error: any) {
    console.error('Error getting timetable configuration:', error);
    throw new Error(`Failed to get configuration: ${error.message}`);
  }
}

export async function exportTimetable(
  organizationId: string,
  filters?: {
    classId?: string;
    teacherId?: string;
    academicYear?: string;
  }
): Promise<string> {
  try {
    const entries = await getTimetableEntries(organizationId, filters);

    const header = [
      'Day',
      'Period',
      'Start Time',
      'End Time',
      'Class',
      'Subject',
      'Teacher',
      'Room',
    ].join(',');

    const rows = entries.map(entry =>
      [
        entry.dayOfWeek,
        entry.period,
        entry.startTime,
        entry.endTime,
        entry.className,
        entry.subjectName,
        entry.teacherName,
        entry.room || '',
      ].join(',')
    );

    return [header, ...rows].join('\n');
  } catch (error: any) {
    console.error('Error exporting timetable:', error);
    throw new Error(`Failed to export timetable: ${error.message}`);
  }
}
