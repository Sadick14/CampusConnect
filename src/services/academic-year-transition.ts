/**
 * Academic Year Transition Service
 * 
 * Handles the complete transition from one academic year to another:
 * - Class promotion/rollover
 * - Student promotion
 * - Fee structure rollover
 * - Staff assignments rollover
 * - Timetable templates
 * - Financial data isolation (fees stay with their academic year)
 */

import { getDb } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  writeBatch,
  query,
  where,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { getCurrentAcademicYear } from './academic-year';
import { getSchoolClasses } from './class';
import { getStudentsByOrganization } from './student';
import { getSchoolFeeTypes } from './fee';

export interface TransitionOptions {
  organizationId: string;
  currentYearId: string;
  newYearId: string;
  newYearName: string;
  
  // What to transition
  rolloverClasses: boolean;
  promoteStudents: boolean;
  rolloverFeeStructure: boolean;
  rolloverStaffAssignments: boolean;
  copyTimetableTemplates: boolean;
  
  // Student promotion rules
  studentPromotionRules?: StudentPromotionRule[];
  
  // Classes to create in new year
  classesToCreate?: string[]; // Class IDs to rollover
}

export interface StudentPromotionRule {
  fromClass: string;
  toClass: string;
  autoPromote: boolean; // If false, requires manual approval
}

export interface TransitionResult {
  success: boolean;
  message: string;
  stats: {
    classesRolledOver: number;
    studentsPromoted: number;
    feeTypesRolledOver: number;
    staffAssignmentsRolledOver: number;
    timetablesCopied: number;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Execute the complete academic year transition
 */
export async function executeAcademicYearTransition(
  options: TransitionOptions
): Promise<TransitionResult> {
  const result: TransitionResult = {
    success: false,
    message: '',
    stats: {
      classesRolledOver: 0,
      studentsPromoted: 0,
      feeTypesRolledOver: 0,
      staffAssignmentsRolledOver: 0,
      timetablesCopied: 0,
    },
    errors: [],
    warnings: [],
  };

  try {
    const db = getDb();

    // Step 1: Rollover Classes
    if (options.rolloverClasses) {
      const classResult = await rolloverClasses(
        options.organizationId,
        options.newYearName,
        options.classesToCreate
      );
      result.stats.classesRolledOver = classResult.count;
      result.warnings.push(...classResult.warnings);
    }

    // Step 2: Rollover Fee Structure (but not actual fee records)
    if (options.rolloverFeeStructure) {
      const feeResult = await rolloverFeeStructure(
        options.organizationId,
        options.newYearName
      );
      result.stats.feeTypesRolledOver = feeResult.count;
      result.warnings.push(...feeResult.warnings);
    }

    // Step 3: Promote Students
    if (options.promoteStudents && options.studentPromotionRules) {
      const studentResult = await promoteStudents(
        options.organizationId,
        options.newYearName,
        options.studentPromotionRules
      );
      result.stats.studentsPromoted = studentResult.count;
      result.warnings.push(...studentResult.warnings);
    }

    // Step 4: Rollover Staff Assignments
    if (options.rolloverStaffAssignments) {
      const staffResult = await rolloverStaffAssignments(
        options.organizationId,
        options.currentYearId,
        options.newYearName
      );
      result.stats.staffAssignmentsRolledOver = staffResult.count;
      result.warnings.push(...staffResult.warnings);
    }

    // Step 5: Copy Timetable Templates
    if (options.copyTimetableTemplates) {
      const timetableResult = await copyTimetableTemplates(
        options.organizationId,
        options.currentYearId,
        options.newYearName
      );
      result.stats.timetablesCopied = timetableResult.count;
      result.warnings.push(...timetableResult.warnings);
    }

    result.success = true;
    result.message = `Academic year transition completed successfully. ${result.stats.classesRolledOver} classes, ${result.stats.studentsPromoted} students promoted.`;

  } catch (error: any) {
    result.success = false;
    result.message = 'Academic year transition failed';
    result.errors.push(error.message);
    console.error('Year transition error:', error);
  }

  return result;
}

/**
 * Rollover classes to new academic year
 * Creates new class records for the new year while keeping old year classes intact
 */
async function rolloverClasses(
  organizationId: string,
  newYearName: string,
  classIds?: string[]
): Promise<{ count: number; warnings: string[] }> {
  const db = getDb();
  const warnings: string[] = [];
  let count = 0;

  try {
    // Get current year classes
    const currentYear = await getCurrentAcademicYear(organizationId);
    if (!currentYear) {
      throw new Error('No current academic year found');
    }

    const classes = await getSchoolClasses(organizationId, currentYear.name);
    
    // Filter classes if specific IDs provided
    const classesToRollover = classIds 
      ? classes.filter(c => classIds.includes(c.id))
      : classes;

    if (classesToRollover.length === 0) {
      warnings.push('No classes to rollover');
      return { count: 0, warnings };
    }

    // Create new classes in batches
    const batch = writeBatch(db);
    const classesRef = collection(db, 'classes');

    for (const cls of classesToRollover) {
      const newClassRef = doc(classesRef);
      
      batch.set(newClassRef, {
        organizationId,
        className: cls.className,
        schoolType: cls.schoolType,
        gradeLevel: cls.gradeLevel,
        section: cls.section,
        academicYear: newYearName, // New academic year
        capacity: cls.capacity,
        currentEnrollment: 0, // Reset enrollment
        classTeacherId: null, // Clear teacher assignment
        classTeacherName: null,
        subjects: cls.subjects || [], // Keep subject structure
        isActive: true,
        description: cls.description || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      count++;
    }

    await batch.commit();

  } catch (error: any) {
    warnings.push(`Error rolling over classes: ${error.message}`);
    console.error('Rollover classes error:', error);
  }

  return { count, warnings };
}

/**
 * Rollover fee structure (fee types) to new academic year
 * Does NOT copy actual fee records - those stay with their academic year
 */
async function rolloverFeeStructure(
  organizationId: string,
  newYearName: string
): Promise<{ count: number; warnings: string[] }> {
  const db = getDb();
  const warnings: string[] = [];
  let count = 0;

  try {
    // Get current fee types
    const feeTypes = await getSchoolFeeTypes(organizationId);

    if (feeTypes.length === 0) {
      warnings.push('No fee types to rollover');
      return { count: 0, warnings };
    }

    const batch = writeBatch(db);
    const feeTypesRef = collection(db, 'fee_types');

    for (const feeType of feeTypes) {
      const newFeeTypeRef = doc(feeTypesRef);
      
      batch.set(newFeeTypeRef, {
        schoolId: organizationId,
        name: feeType.name,
        displayName: feeType.displayName,
        description: feeType.description || '',
        isRecurring: feeType.isRecurring || false,
        frequency: feeType.frequency,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      count++;
    }

    await batch.commit();
    warnings.push('Fee types rolled over. Please review and update amounts and due dates for the new year.');

  } catch (error: any) {
    warnings.push(`Error rolling over fee structure: ${error.message}`);
    console.error('Rollover fee structure error:', error);
  }

  return { count, warnings };
}

/**
 * Promote students to their next class
 */
async function promoteStudents(
  organizationId: string,
  newYearName: string,
  promotionRules: StudentPromotionRule[]
): Promise<{ count: number; warnings: string[] }> {
  const db = getDb();
  const warnings: string[] = [];
  let count = 0;

  try {
    // Get all active students
    const students = await getStudentsByOrganization(organizationId);
    const activeStudents = students.filter((s: any) => s.status === 'active');

    if (activeStudents.length === 0) {
      warnings.push('No active students to promote');
      return { count: 0, warnings };
    }

    const batch = writeBatch(db);
    const studentsRef = collection(db, 'students');

    // Create promotion rule map for quick lookup
    const ruleMap = new Map(
      promotionRules.map(rule => [rule.fromClass, rule])
    );

    for (const student of activeStudents) {
      const currentClass = student.currentClass;
      const rule = ruleMap.get(currentClass);

      if (rule && rule.autoPromote) {
        const studentRef = doc(studentsRef, student.id);
        
        // Update student's class and academic year
        batch.update(studentRef, {
          currentClass: rule.toClass,
          academicYear: newYearName,
          previousClass: currentClass,
          promotedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        
        count++;
      } else if (currentClass && !rule) {
        warnings.push(`No promotion rule defined for class: ${currentClass}`);
      }
    }

    if (count > 0) {
      await batch.commit();
    }

  } catch (error: any) {
    warnings.push(`Error promoting students: ${error.message}`);
    console.error('Promote students error:', error);
  }

  return { count, warnings };
}

/**
 * Rollover staff assignments to new academic year
 */
async function rolloverStaffAssignments(
  organizationId: string,
  currentYearId: string,
  newYearName: string
): Promise<{ count: number; warnings: string[] }> {
  const db = getDb();
  const warnings: string[] = [];
  let count = 0;

  try {
    // Get current year staff assignments
    const assignmentsQuery = query(
      collection(db, 'staff_assignments'),
      where('organizationId', '==', organizationId),
      where('academicYear', '==', currentYearId)
    );

    const snapshot = await getDocs(assignmentsQuery);
    
    if (snapshot.empty) {
      warnings.push('No staff assignments to rollover');
      return { count: 0, warnings };
    }

    const batch = writeBatch(db);
    const assignmentsRef = collection(db, 'staff_assignments');

    for (const docSnap of snapshot.docs) {
      const assignment = docSnap.data();
      const newAssignmentRef = doc(assignmentsRef);
      
      batch.set(newAssignmentRef, {
        ...assignment,
        academicYear: newYearName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      count++;
    }

    await batch.commit();
    warnings.push('Staff assignments rolled over. Please review and adjust as needed.');

  } catch (error: any) {
    warnings.push(`Error rolling over staff assignments: ${error.message}`);
    console.error('Rollover staff assignments error:', error);
  }

  return { count, warnings };
}

/**
 * Copy timetable templates to new academic year
 */
async function copyTimetableTemplates(
  organizationId: string,
  currentYearId: string,
  newYearName: string
): Promise<{ count: number; warnings: string[] }> {
  const db = getDb();
  const warnings: string[] = [];
  let count = 0;

  try {
    // Get current year timetables
    const timetablesQuery = query(
      collection(db, 'timetables'),
      where('organizationId', '==', organizationId),
      where('academicYear', '==', currentYearId)
    );

    const snapshot = await getDocs(timetablesQuery);
    
    if (snapshot.empty) {
      warnings.push('No timetables to copy');
      return { count: 0, warnings };
    }

    const batch = writeBatch(db);
    const timetablesRef = collection(db, 'timetables');

    for (const docSnap of snapshot.docs) {
      const timetable = docSnap.data();
      const newTimetableRef = doc(timetablesRef);
      
      batch.set(newTimetableRef, {
        ...timetable,
        academicYear: newYearName,
        status: 'draft', // Start as draft for new year
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      count++;
    }

    await batch.commit();
    warnings.push('Timetables copied as drafts. Please review and publish when ready.');

  } catch (error: any) {
    warnings.push(`Error copying timetables: ${error.message}`);
    console.error('Copy timetables error:', error);
  }

  return { count, warnings };
}

/**
 * Get transition preview - shows what will happen without executing
 */
export async function previewAcademicYearTransition(
  organizationId: string
): Promise<{
  currentYear: string;
  classes: number;
  students: number;
  feeTypes: number;
  staffAssignments: number;
  timetables: number;
}> {
  const db = getDb();
  
  try {
    const currentYear = await getCurrentAcademicYear(organizationId);
    if (!currentYear) {
      throw new Error('No current academic year found');
    }

    const [classes, students, feeTypes] = await Promise.all([
      getSchoolClasses(organizationId, currentYear.name),
      getStudentsByOrganization(organizationId),
      getSchoolFeeTypes(organizationId),
    ]);

    // Count staff assignments
    const staffQuery = query(
      collection(db, 'staff_assignments'),
      where('organizationId', '==', organizationId)
    );
    const staffSnapshot = await getDocs(staffQuery);

    // Count timetables
    const timetableQuery = query(
      collection(db, 'timetables'),
      where('organizationId', '==', organizationId)
    );
    const timetableSnapshot = await getDocs(timetableQuery);

    return {
      currentYear: currentYear.name,
      classes: classes.length,
      students: students.filter((s: any) => s.status === 'active').length,
      feeTypes: feeTypes.length,
      staffAssignments: staffSnapshot.size,
      timetables: timetableSnapshot.size,
    };
  } catch (error) {
    console.error('Preview transition error:', error);
    throw error;
  }
}
