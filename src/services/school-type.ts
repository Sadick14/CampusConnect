import { getDb } from '@/lib/firebase';
import { 
  SCHOOL_TYPE_CONFIGS, 
  getClassesForSchoolTypes, 
  getSubjectsForSchoolTypes,
  type SchoolType,
  type ClassTemplate,
  type SubjectTemplate,
} from '@/lib/school-types';
import { doc, updateDoc, getDoc, collection, writeBatch, Timestamp } from 'firebase/firestore';
import { getCurrentAcademicYear } from './academic-year';

/**
 * Update organization with selected school types
 */
export async function updateOrganizationSchoolTypes(
  organizationId: string,
  schoolTypes: SchoolType[]
): Promise<void> {
  try {
    const db = getDb();
    const orgRef = doc(db, 'organizations', organizationId);
    
    await updateDoc(orgRef, {
      schoolTypes,
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    console.error('Error updating school types:', error);
    throw new Error(error.message || 'Failed to update school types');
  }
}

/**
 * Get organization's school types
 */
export async function getOrganizationSchoolTypes(
  organizationId: string
): Promise<SchoolType[]> {
  try {
    const db = getDb();
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    
    if (!orgDoc.exists()) {
      throw new Error('Organization not found');
    }
    
    const data = orgDoc.data();
    return data.schoolTypes || [];
  } catch (error: any) {
    console.error('Error getting school types:', error);
    throw new Error(error.message || 'Failed to get school types');
  }
}

/**
 * Auto-seed classes based on selected school types
 */
export async function seedClassesForSchoolTypes(
  organizationId: string,
  schoolTypes: SchoolType[],
  academicYear?: string
): Promise<{ classesCreated: number; message: string }> {
  try {
    const db = getDb();
    const classesRef = collection(db, 'classes');
    
    // Get class templates for selected school types with their types
    const classTemplatesWithTypes: Array<{ template: ClassTemplate; schoolType: SchoolType }> = [];
    
    schoolTypes.forEach(type => {
      const templates = getClassesForSchoolTypes([type]);
      templates.forEach(template => {
        classTemplatesWithTypes.push({ template, schoolType: type });
      });
    });
    
    if (classTemplatesWithTypes.length === 0) {
      return { classesCreated: 0, message: 'No classes to create' };
    }
    
    // Get current academic year from database or use provided one
    let yearToUse = academicYear;
    if (!yearToUse) {
      const currentAcademicYear = await getCurrentAcademicYear(organizationId);
      yearToUse = currentAcademicYear?.name || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;
    }
    
    // Use batch to create all classes
    const batch = writeBatch(db);
    
    classTemplatesWithTypes.forEach(({ template, schoolType }) => {
      const classDocRef = doc(classesRef);
      
      batch.set(classDocRef, {
        organizationId,
        className: template.name,
        displayName: template.displayName,
        classOrder: template.order,
        schoolType, // Add school type identifier
        ageRange: template.ageRange || null,
        academicYear: yearToUse,
        capacity: 30, // Default capacity
        currentEnrollment: 0,
        classTeacher: null,
        subjects: [],
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });
    
    await batch.commit();
    
    return {
      classesCreated: classTemplatesWithTypes.length,
      message: `Successfully created ${classTemplatesWithTypes.length} classes`,
    };
  } catch (error: any) {
    console.error('Error seeding classes:', error);
    throw new Error(error.message || 'Failed to seed classes');
  }
}

/**
 * Auto-seed subjects based on selected school types
 */
export async function seedSubjectsForSchoolTypes(
  organizationId: string,
  schoolTypes: SchoolType[]
): Promise<{ subjectsCreated: number; message: string }> {
  try {
    const db = getDb();
    const subjectsRef = collection(db, 'subjects');
    
    // Get subject templates for selected school types with their types
    const subjectTemplatesWithTypes: Array<{ template: SubjectTemplate; schoolTypes: SchoolType[] }> = [];
    const subjectMap = new Map<string, { template: SubjectTemplate; types: Set<SchoolType> }>();
    
    // Collect all subjects and track which school types they belong to
    schoolTypes.forEach(type => {
      const config = SCHOOL_TYPE_CONFIGS[type];
      config.subjects.forEach(subject => {
        const key = subject.code;
        if (subjectMap.has(key)) {
          subjectMap.get(key)!.types.add(type);
        } else {
          subjectMap.set(key, {
            template: subject,
            types: new Set([type])
          });
        }
      });
    });
    
    // Convert map to array
    subjectMap.forEach(({ template, types }) => {
      subjectTemplatesWithTypes.push({
        template,
        schoolTypes: Array.from(types)
      });
    });
    
    if (subjectTemplatesWithTypes.length === 0) {
      return { subjectsCreated: 0, message: 'No subjects to create' };
    }
    
    // Use batch to create all subjects
    const batch = writeBatch(db);
    
    subjectTemplatesWithTypes.forEach(({ template, schoolTypes: subjectSchoolTypes }) => {
      const subjectDocRef = doc(subjectsRef);
      
      batch.set(subjectDocRef, {
        organizationId,
        name: template.name,
        code: template.code,
        category: template.category,
        periodsPerWeek: template.periodsPerWeek,
        description: template.description || '',
        schoolTypes: subjectSchoolTypes, // Add school types array
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });
    
    await batch.commit();
    
    return {
      subjectsCreated: subjectTemplatesWithTypes.length,
      message: `Successfully created ${subjectTemplatesWithTypes.length} subjects`,
    };
  } catch (error: any) {
    console.error('Error seeding subjects:', error);
    throw new Error(error.message || 'Failed to seed subjects');
  }
}

/**
 * Complete setup: Update school types and seed classes & subjects
 */
export async function setupSchoolTypesAndSeed(
  organizationId: string,
  schoolTypes: SchoolType[],
  seedClasses: boolean = true,
  seedSubjects: boolean = true,
  academicYear?: string
): Promise<{
  success: boolean;
  classesCreated: number;
  subjectsCreated: number;
  message: string;
}> {
  try {
    // Update organization with school types
    await updateOrganizationSchoolTypes(organizationId, schoolTypes);
    
    let classesCreated = 0;
    let subjectsCreated = 0;
    
    // Seed classes if requested
    if (seedClasses) {
      const classResult = await seedClassesForSchoolTypes(
        organizationId,
        schoolTypes,
        academicYear
      );
      classesCreated = classResult.classesCreated;
    }
    
    // Seed subjects if requested
    if (seedSubjects) {
      const subjectResult = await seedSubjectsForSchoolTypes(
        organizationId,
        schoolTypes
      );
      subjectsCreated = subjectResult.subjectsCreated;
    }
    
    return {
      success: true,
      classesCreated,
      subjectsCreated,
      message: `Setup complete! Created ${classesCreated} classes and ${subjectsCreated} subjects`,
    };
  } catch (error: any) {
    console.error('Error in school type setup:', error);
    throw new Error(error.message || 'Failed to setup school types');
  }
}

/**
 * Check if classes already exist for organization
 */
export async function checkExistingClasses(
  organizationId: string
): Promise<{ hasClasses: boolean; count: number }> {
  try {
    const db = getDb();
    const classesRef = collection(db, 'classes');
    const { getDocs, query, where } = await import('firebase/firestore');
    
    const q = query(classesRef, where('organizationId', '==', organizationId));
    const snapshot = await getDocs(q);
    
    return {
      hasClasses: snapshot.size > 0,
      count: snapshot.size,
    };
  } catch (error: any) {
    console.error('Error checking existing classes:', error);
    return { hasClasses: false, count: 0 };
  }
}

/**
 * Check if subjects already exist for organization
 */
export async function checkExistingSubjects(
  organizationId: string
): Promise<{ hasSubjects: boolean; count: number }> {
  try {
    const db = getDb();
    const subjectsRef = collection(db, 'subjects');
    const { getDocs, query, where } = await import('firebase/firestore');
    
    const q = query(subjectsRef, where('organizationId', '==', organizationId));
    const snapshot = await getDocs(q);
    
    return {
      hasSubjects: snapshot.size > 0,
      count: snapshot.size,
    };
  } catch (error: any) {
    console.error('Error checking existing subjects:', error);
    return { hasSubjects: false, count: 0 };
  }
}
