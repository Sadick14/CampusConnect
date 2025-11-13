'use server';
/**
 * @fileOverview Service functions for managing grades and assessments in Firestore.
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
  serverTimestamp
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase-server';

/**
 * Represents a grade/assessment record.
 */
export interface Grade {
  /**
   * The unique identifier of the grade record.
   */
  id: string;
  /**
   * The student ID.
   */
  studentId: string;
  /**
   * The student name (denormalized).
   */
  studentName?: string;
  /**
   * The school ID.
   */
  organizationId: string;
  /**
   * The class/grade level.
   */
  class?: string;
  /**
   * The subject.
   */
  subject: string;
  /**
   * The assessment type (exam, quiz, assignment, project, etc.).
   */
  assessmentType?: 'exam' | 'quiz' | 'assignment' | 'project' | 'homework' | 'other';
  /**
   * The assessment name/title.
   */
  assessmentName?: string;
  /**
   * The numeric grade/score.
   */
  grade: number;
  /**
   * The maximum possible score.
   */
  maxGrade?: number;
  /**
   * Letter grade (A, B, C, etc.) - optional.
   */
  letterGrade?: string;
  /**
   * The academic term/semester.
   */
  term?: string;
  /**
   * The academic year.
   */
  academicYear?: string;
  /**
   * The date the grade was recorded (ISO string).
   */
  date?: string;
  /**
   * Teacher comments/feedback.
   */
  comments?: string | null;
  /**
   * Creation timestamp.
   */
  createdAt?: string;
  /**
   * Last update timestamp.
   */
  updatedAt?: string;
}

/**
 * Asynchronously retrieves a grade record by ID.
 *
 * @param id The Firestore document ID of the grade.
 * @returns A promise that resolves to a Grade object if found, or null if not found.
 */
export async function getGrade(id: string): Promise<Grade | null> {
  try {
    const db = getDb();
    const gradeRef = doc(db, 'grades', id);
    const gradeSnap = await getDoc(gradeRef);

    if (!gradeSnap.exists()) {
      return null;
    }

    const data = gradeSnap.data();
    return {
      id: gradeSnap.id,
      studentId: data.studentId,
      studentName: data.studentName,
      organizationId: data.organizationId,
      class: data.class,
      subject: data.subject,
      assessmentType: data.assessmentType,
      assessmentName: data.assessmentName,
      grade: data.grade,
      maxGrade: data.maxGrade,
      letterGrade: data.letterGrade,
      term: data.term,
      academicYear: data.academicYear,
      date: data.date,
      comments: data.comments,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    };
  } catch (error: any) {
    console.error(`Error fetching grade with ID ${id}:`, error);
    throw new Error(`Failed to fetch grade: ${error.message}`);
  }
}

/**
 * Asynchronously retrieves grades for a specific student.
 *
 * @param studentId The student ID.
 * @param subjectFilter Optional subject filter.
 * @param termFilter Optional term filter.
 * @returns A promise that resolves to an array of Grade objects.
 */
export async function getStudentGrades(
  studentId: string,
  subjectFilter?: string,
  termFilter?: string
): Promise<Grade[]> {
  try {
    const db = getDb();
    const gradesRef = collection(db, 'grades');
    
    let q = query(
      gradesRef,
      where('studentId', '==', studentId),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const grades: Grade[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Apply filters if provided
      if (subjectFilter && data.subject !== subjectFilter) return;
      if (termFilter && data.term !== termFilter) return;
      
      grades.push({
        id: doc.id,
        studentId: data.studentId,
        studentName: data.studentName,
        organizationId: data.organizationId,
        class: data.class,
        subject: data.subject,
        assessmentType: data.assessmentType,
        assessmentName: data.assessmentName,
        grade: data.grade,
        maxGrade: data.maxGrade,
        letterGrade: data.letterGrade,
        term: data.term,
        academicYear: data.academicYear,
        date: data.date,
        comments: data.comments,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      });
    });

    return grades;
  } catch (error: any) {
    console.error(`Error fetching grades for student ${studentId}:`, error);
    throw new Error(`Failed to fetch student grades: ${error.message}`);
  }
}

/**
 * Asynchronously retrieves grades for a school/class.
 *
 * @param organizationId The school ID.
 * @param classFilter Optional class filter.
 * @param subjectFilter Optional subject filter.
 * @param termFilter Optional term filter.
 * @returns A promise that resolves to an array of Grade objects.
 */
export async function getGradesBySchool(
  organizationId: string,
  classFilter?: string,
  subjectFilter?: string,
  termFilter?: string
): Promise<Grade[]> {
  try {
    const db = getDb();
    const gradesRef = collection(db, 'grades');
    
    let q = query(
      gradesRef,
      where('organizationId', '==', organizationId),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const grades: Grade[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Apply filters if provided
      if (classFilter && data.class !== classFilter) return;
      if (subjectFilter && data.subject !== subjectFilter) return;
      if (termFilter && data.term !== termFilter) return;
      
      grades.push({
        id: doc.id,
        studentId: data.studentId,
        studentName: data.studentName,
        organizationId: data.organizationId,
        class: data.class,
        subject: data.subject,
        assessmentType: data.assessmentType,
        assessmentName: data.assessmentName,
        grade: data.grade,
        maxGrade: data.maxGrade,
        letterGrade: data.letterGrade,
        term: data.term,
        academicYear: data.academicYear,
        date: data.date,
        comments: data.comments,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      });
    });

    return grades;
  } catch (error: any) {
    console.error(`Error fetching grades for school ${organizationId}:`, error);
    throw new Error(`Failed to fetch grades: ${error.message}`);
  }
}

/**
 * Asynchronously creates a new grade record.
 *
 * @param grade The grade data to create (without id).
 * @returns A promise that resolves to the created Grade object.
 */
export async function createGrade(
  grade: Omit<Grade, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Grade> {
  try {
    const db = getDb();
    const gradesRef = collection(db, 'grades');

    // Calculate letter grade if not provided
    let letterGrade = grade.letterGrade;
    if (!letterGrade && grade.maxGrade) {
      const percentage = (grade.grade / grade.maxGrade) * 100;
      letterGrade = calculateLetterGrade(percentage);
    }

    const gradeData = {
      ...grade,
      letterGrade: letterGrade || null,
      date: grade.date || new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(gradesRef, gradeData);
    console.log(`Grade record created with ID: ${docRef.id}`);

    const createdGrade = await getGrade(docRef.id);
    if (!createdGrade) {
      throw new Error('Failed to retrieve created grade');
    }

    return createdGrade;
  } catch (error: any) {
    console.error('Error creating grade:', error);
    throw new Error(`Failed to create grade: ${error.message}`);
  }
}

/**
 * Asynchronously updates a grade record.
 *
 * @param id The grade's Firestore document ID.
 * @param updates Partial grade data to update.
 * @returns A promise that resolves to the updated Grade object.
 */
export async function updateGrade(
  id: string,
  updates: Partial<Omit<Grade, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Grade> {
  try {
    const db = getDb();
    const gradeRef = doc(db, 'grades', id);

    // Recalculate letter grade if grade or maxGrade is updated
    let letterGrade = updates.letterGrade;
    if ((updates.grade || updates.maxGrade) && !letterGrade) {
      const existingGrade = await getGrade(id);
      if (existingGrade) {
        const newGrade = updates.grade ?? existingGrade.grade;
        const newMaxGrade = updates.maxGrade ?? existingGrade.maxGrade;
        if (newMaxGrade) {
          const percentage = (newGrade / newMaxGrade) * 100;
          letterGrade = calculateLetterGrade(percentage);
        }
      }
    }

    const updateData = {
      ...updates,
      ...(letterGrade ? { letterGrade } : {}),
      updatedAt: serverTimestamp(),
    };

    await updateDoc(gradeRef, updateData);
    console.log(`Grade ${id} updated successfully`);

    const updatedGrade = await getGrade(id);
    if (!updatedGrade) {
      throw new Error('Failed to retrieve updated grade');
    }

    return updatedGrade;
  } catch (error: any) {
    console.error(`Error updating grade ${id}:`, error);
    throw new Error(`Failed to update grade: ${error.message}`);
  }
}

/**
 * Asynchronously deletes a grade record.
 *
 * @param id The grade's Firestore document ID.
 * @returns A promise that resolves when the grade is deleted.
 */
export async function deleteGrade(id: string): Promise<void> {
  try {
    const db = getDb();
    const gradeRef = doc(db, 'grades', id);
    
    await deleteDoc(gradeRef);
    console.log(`Grade ${id} deleted successfully`);
  } catch (error: any) {
    console.error(`Error deleting grade ${id}:`, error);
    throw new Error(`Failed to delete grade: ${error.message}`);
  }
}

/**
 * Helper function to calculate letter grade from percentage.
 *
 * @param percentage The percentage score.
 * @returns The letter grade.
 */
function calculateLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}
