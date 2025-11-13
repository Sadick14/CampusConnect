import { getDb } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';

/**
 * Student Promotion Service
 * Handles promoting students to the next grade/class at end of academic year
 */

export interface PromotionRule {
  fromClass: string;
  toClass: string;
  gradeLevel: number;
}

export interface PromotionResult {
  totalStudents: number;
  promoted: number;
  failed: number;
  graduated: number;
  errors: string[];
  promotedStudents: Array<{
    studentId: string;
    name: string;
    fromClass: string;
    toClass: string;
  }>;
  graduatedStudents: Array<{
    studentId: string;
    name: string;
    finalClass: string;
  }>;
}

// Default promotion rules (can be customized per organization)
const DEFAULT_PROMOTION_RULES: PromotionRule[] = [
  // Nursery
  { fromClass: 'Nursery 1', toClass: 'Nursery 2', gradeLevel: 1 },
  { fromClass: 'Nursery 2', toClass: 'KG 1', gradeLevel: 2 },
  
  // Kindergarten
  { fromClass: 'KG 1', toClass: 'KG 2', gradeLevel: 3 },
  { fromClass: 'KG 2', toClass: 'Class 1', gradeLevel: 4 },
  
  // Primary
  { fromClass: 'Class 1', toClass: 'Class 2', gradeLevel: 5 },
  { fromClass: 'Class 2', toClass: 'Class 3', gradeLevel: 6 },
  { fromClass: 'Class 3', toClass: 'Class 4', gradeLevel: 7 },
  { fromClass: 'Class 4', toClass: 'Class 5', gradeLevel: 8 },
  { fromClass: 'Class 5', toClass: 'Class 6', gradeLevel: 9 },
  { fromClass: 'Class 6', toClass: 'JHS 1', gradeLevel: 10 },
  
  // Junior High School
  { fromClass: 'JHS 1', toClass: 'JHS 2', gradeLevel: 11 },
  { fromClass: 'JHS 2', toClass: 'JHS 3', gradeLevel: 12 },
  { fromClass: 'JHS 3', toClass: 'SHS 1', gradeLevel: 13 },
  
  // Senior High School
  { fromClass: 'SHS 1', toClass: 'SHS 2', gradeLevel: 14 },
  { fromClass: 'SHS 2', toClass: 'SHS 3', gradeLevel: 15 },
  // SHS 3 graduates (no toClass)
];

// Classes that lead to graduation
const GRADUATING_CLASSES = ['SHS 3', 'JHS 3 (Terminal)', 'Class 6 (Terminal)'];

/**
 * Get promotion rule for a class
 */
function getPromotionRule(className: string): PromotionRule | null {
  return DEFAULT_PROMOTION_RULES.find(rule => rule.fromClass === className) || null;
}

/**
 * Check if a class is a graduating class
 */
function isGraduatingClass(className: string): boolean {
  return GRADUATING_CLASSES.includes(className) || className === 'SHS 3';
}

/**
 * Promote all students in an organization to next grade
 */
export async function promoteAllStudents(
  organizationId: string,
  academicYearId: string,
  options?: {
    promoteAllClasses?: boolean; // Promote all classes or only specific ones
    specificClasses?: string[]; // Only promote these classes
    excludeFailedStudents?: boolean; // Skip students with failing grades
    dryRun?: boolean; // Preview without making changes
  }
): Promise<PromotionResult> {
  const db = getDb();
  const result: PromotionResult = {
    totalStudents: 0,
    promoted: 0,
    failed: 0,
    graduated: 0,
    errors: [],
    promotedStudents: [],
    graduatedStudents: [],
  };

  try {
    console.log(`[Promotion] Starting promotion for organization: ${organizationId}`);

    // Get all active students
    const studentsQuery = query(
      collection(db, 'students'),
      where('organizationId', '==', organizationId),
      where('status', '==', 'active')
    );

    const studentsSnapshot = await getDocs(studentsQuery);
    result.totalStudents = studentsSnapshot.size;

    console.log(`[Promotion] Found ${result.totalStudents} active students`);

    if (result.totalStudents === 0) {
      console.log('[Promotion] No students to promote');
      return result;
    }

    // Group students by class
    const studentsByClass = new Map<string, any[]>();
    studentsSnapshot.forEach(doc => {
      const student = { id: doc.id, ...doc.data() };
      const className = student.currentClass;
      if (!studentsByClass.has(className)) {
        studentsByClass.set(className, []);
      }
      studentsByClass.get(className)!.push(student);
    });

    console.log(`[Promotion] Students grouped into ${studentsByClass.size} classes`);

    // Create batch for updates
    const batch = writeBatch(db);
    let batchCount = 0;
    const MAX_BATCH_SIZE = 500;

    // Process each class
    for (const [className, students] of studentsByClass.entries()) {
      // Check if we should process this class
      if (options?.specificClasses && !options.specificClasses.includes(className)) {
        console.log(`[Promotion] Skipping class: ${className} (not in specific classes list)`);
        continue;
      }

      console.log(`[Promotion] Processing class: ${className} (${students.length} students)`);

      // Check if graduating class
      if (isGraduatingClass(className)) {
        // Graduate students
        for (const student of students) {
          if (!options?.dryRun) {
            const studentRef = doc(db, 'students', student.id);
            batch.update(studentRef, {
              status: 'graduated',
              previousClass: student.currentClass,
              graduationDate: new Date().toISOString(),
              updatedAt: Timestamp.now(),
            });
            batchCount++;

            // Commit batch if reaching limit
            if (batchCount >= MAX_BATCH_SIZE) {
              await batch.commit();
              console.log(`[Promotion] Committed batch of ${batchCount} updates`);
              batchCount = 0;
            }
          }

          result.graduated++;
          result.graduatedStudents.push({
            studentId: student.id,
            name: `${student.firstName} ${student.lastName}`,
            finalClass: className,
          });
        }

        console.log(`[Promotion] Graduated ${students.length} students from ${className}`);
        continue;
      }

      // Get promotion rule
      const promotionRule = getPromotionRule(className);
      if (!promotionRule) {
        console.log(`[Promotion] No promotion rule for class: ${className}`);
        result.errors.push(`No promotion rule defined for class: ${className}`);
        continue;
      }

      // Promote students
      for (const student of students) {
        // TODO: Check if student failed (if excludeFailedStudents is true)
        // This would require checking grades from the grades collection
        
        if (!options?.dryRun) {
          const studentRef = doc(db, 'students', student.id);
          batch.update(studentRef, {
            currentClass: promotionRule.toClass,
            previousClass: student.currentClass,
            section: null, // Reset section for new class
            rollNumber: null, // Reset roll number
            promotedAt: new Date().toISOString(),
            academicYear: academicYearId,
            updatedAt: Timestamp.now(),
          });
          batchCount++;

          // Commit batch if reaching limit
          if (batchCount >= MAX_BATCH_SIZE) {
            await batch.commit();
            console.log(`[Promotion] Committed batch of ${batchCount} updates`);
            batchCount = 0;
          }
        }

        result.promoted++;
        result.promotedStudents.push({
          studentId: student.id,
          name: `${student.firstName} ${student.lastName}`,
          fromClass: className,
          toClass: promotionRule.toClass,
        });
      }

      console.log(`[Promotion] Promoted ${students.length} students from ${className} to ${promotionRule.toClass}`);
    }

    // Commit remaining updates
    if (batchCount > 0 && !options?.dryRun) {
      await batch.commit();
      console.log(`[Promotion] Committed final batch of ${batchCount} updates`);
    }

    console.log('[Promotion] Summary:');
    console.log(`  Total Students: ${result.totalStudents}`);
    console.log(`  Promoted: ${result.promoted}`);
    console.log(`  Graduated: ${result.graduated}`);
    console.log(`  Failed: ${result.failed}`);
    console.log(`  Errors: ${result.errors.length}`);

    return result;
  } catch (error) {
    console.error('[Promotion] Error promoting students:', error);
    throw new Error('Failed to promote students');
  }
}

/**
 * Preview promotion results without making changes
 */
export async function previewPromotion(
  organizationId: string,
  academicYearId: string
): Promise<PromotionResult> {
  return promoteAllStudents(organizationId, academicYearId, { dryRun: true });
}

/**
 * Promote specific classes only
 */
export async function promoteSpecificClasses(
  organizationId: string,
  academicYearId: string,
  classNames: string[]
): Promise<PromotionResult> {
  return promoteAllStudents(organizationId, academicYearId, {
    specificClasses: classNames,
  });
}

/**
 * Get promotion rules for display
 */
export function getPromotionRules(): PromotionRule[] {
  return DEFAULT_PROMOTION_RULES;
}

/**
 * Get next class for a given class
 */
export function getNextClass(currentClass: string): string | null {
  const rule = getPromotionRule(currentClass);
  return rule?.toClass || null;
}
