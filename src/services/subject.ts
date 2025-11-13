import { getDb } from '@/lib/firebase';
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
  Timestamp 
} from 'firebase/firestore';

export interface Subject {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  category: 'core' | 'elective' | 'activity';
  periodsPerWeek: number;
  description?: string;
  schoolTypes?: string[]; // School types this subject belongs to
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

/**
 * Get all subjects for an organization
 */
export async function getSubjects(organizationId: string): Promise<Subject[]> {
  try {
    const db = getDb();
    const subjectsRef = collection(db, 'subjects');
    const q = query(
      subjectsRef,
      where('organizationId', '==', organizationId),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Subject[];
  } catch (error: any) {
    console.error('Error getting subjects:', error);
    throw new Error(error.message || 'Failed to get subjects');
  }
}

/**
 * Get a single subject by ID
 */
export async function getSubject(subjectId: string): Promise<Subject | null> {
  try {
    const db = getDb();
    const subjectRef = doc(db, 'subjects', subjectId);
    const subjectDoc = await getDoc(subjectRef);

    if (!subjectDoc.exists()) {
      return null;
    }

    return {
      id: subjectDoc.id,
      ...subjectDoc.data(),
    } as Subject;
  } catch (error: any) {
    console.error('Error getting subject:', error);
    throw new Error(error.message || 'Failed to get subject');
  }
}

/**
 * Create a new subject
 */
export async function createSubject(
  data: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const db = getDb();
    const subjectsRef = collection(db, 'subjects');

    const subjectData = {
      ...data,
      isActive: data.isActive ?? true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(subjectsRef, subjectData);
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating subject:', error);
    throw new Error(error.message || 'Failed to create subject');
  }
}

/**
 * Update a subject
 */
export async function updateSubject(
  subjectId: string,
  data: Partial<Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const db = getDb();
    const subjectRef = doc(db, 'subjects', subjectId);

    const updateData = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(subjectRef, updateData);
  } catch (error: any) {
    console.error('Error updating subject:', error);
    throw new Error(error.message || 'Failed to update subject');
  }
}

/**
 * Delete a subject
 */
export async function deleteSubject(subjectId: string): Promise<void> {
  try {
    const db = getDb();
    const subjectRef = doc(db, 'subjects', subjectId);
    await deleteDoc(subjectRef);
  } catch (error: any) {
    console.error('Error deleting subject:', error);
    throw new Error(error.message || 'Failed to delete subject');
  }
}

/**
 * Toggle subject active status
 */
export async function toggleSubjectStatus(
  subjectId: string,
  isActive: boolean
): Promise<void> {
  try {
    const db = getDb();
    const subjectRef = doc(db, 'subjects', subjectId);

    await updateDoc(subjectRef, {
      isActive,
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    console.error('Error toggling subject status:', error);
    throw new Error(error.message || 'Failed to toggle subject status');
  }
}

/**
 * Get subjects by category
 */
export async function getSubjectsByCategory(
  organizationId: string,
  category: 'core' | 'elective' | 'activity'
): Promise<Subject[]> {
  try {
    const db = getDb();
    const subjectsRef = collection(db, 'subjects');
    const q = query(
      subjectsRef,
      where('organizationId', '==', organizationId),
      where('category', '==', category),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Subject[];
  } catch (error: any) {
    console.error('Error getting subjects by category:', error);
    throw new Error(error.message || 'Failed to get subjects');
  }
}

/**
 * Check if subject code already exists
 */
export async function checkSubjectCodeExists(
  organizationId: string,
  code: string,
  excludeId?: string
): Promise<boolean> {
  try {
    const db = getDb();
    const subjectsRef = collection(db, 'subjects');
    const q = query(
      subjectsRef,
      where('organizationId', '==', organizationId),
      where('code', '==', code.toUpperCase())
    );

    const snapshot = await getDocs(q);
    
    if (excludeId) {
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    
    return snapshot.size > 0;
  } catch (error: any) {
    console.error('Error checking subject code:', error);
    return false;
  }
}
