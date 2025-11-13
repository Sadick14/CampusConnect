'use server';
/**
 * @fileOverview Service functions for managing attendance records in Firestore.
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
  serverTimestamp,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase-server';

/**
 * Represents an attendance record.
 */
export interface Attendance {
  /**
   * The unique identifier of the attendance record.
   */
  id: string;
  /**
   * The student ID.
   */
  studentId: string;
  /**
   * The student name (denormalized for easier querying).
   */
  studentName?: string;
  /**
   * The school ID.
   */
  organizationId: string;
  /**
   * The class/grade.
   */
  class?: string;
  /**
   * The date of the attendance record (ISO string, date only).
   */
  date: string;
  /**
   * Whether the student was present.
   */
  present: boolean;
  /**
   * Optional reason for absence.
   */
  absenceReason?: string | null;
  /**
   * Optional notes.
   */
  notes?: string | null;
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
 * Bulk attendance data for marking multiple students.
 */
export interface BulkAttendanceData {
  studentId: string;
  studentName: string;
  class: string;
  present: boolean;
  absenceReason?: string;
  notes?: string;
}

/**
 * Asynchronously retrieves an attendance record by ID.
 *
 * @param id The Firestore document ID of the attendance record.
 * @returns A promise that resolves to an Attendance object if found, or null if not found.
 */
export async function getAttendance(id: string): Promise<Attendance | null> {
  try {
    const db = getDb();
    const attendanceRef = doc(db, 'attendance', id);
    const attendanceSnap = await getDoc(attendanceRef);

    if (!attendanceSnap.exists()) {
      return null;
    }

    const data = attendanceSnap.data();
    return {
      id: attendanceSnap.id,
      studentId: data.studentId,
      studentName: data.studentName,
      organizationId: data.organizationId,
      class: data.class,
      date: data.date,
      present: data.present,
      absenceReason: data.absenceReason,
      notes: data.notes,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    };
  } catch (error: any) {
    console.error(`Error fetching attendance record with ID ${id}:`, error);
    throw new Error(`Failed to fetch attendance: ${error.message}`);
  }
}

/**
 * Asynchronously retrieves attendance records for a specific date and school.
 *
 * @param organizationId The school ID.
 * @param date The date (ISO string, date only).
 * @param classFilter Optional class filter.
 * @returns A promise that resolves to an array of Attendance objects.
 */
export async function getAttendanceByDate(
  organizationId: string, 
  date: string, 
  classFilter?: string
): Promise<Attendance[]> {
  try {
    const db = getDb();
    const attendanceRef = collection(db, 'attendance');
    
    let q = query(
      attendanceRef,
      where('organizationId', '==', organizationId),
      where('date', '==', date)
    );

    if (classFilter) {
      q = query(
        attendanceRef,
        where('organizationId', '==', organizationId),
        where('date', '==', date),
        where('class', '==', classFilter)
      );
    }

    const querySnapshot = await getDocs(q);
    const records: Attendance[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id,
        studentId: data.studentId,
        studentName: data.studentName,
        organizationId: data.organizationId,
        class: data.class,
        date: data.date,
        present: data.present,
        absenceReason: data.absenceReason,
        notes: data.notes,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      });
    });

    return records;
  } catch (error: any) {
    console.error(`Error fetching attendance for date ${date}:`, error);
    throw new Error(`Failed to fetch attendance: ${error.message}`);
  }
}

/**
 * Asynchronously retrieves attendance records for a specific student.
 *
 * @param studentId The student ID.
 * @param startDate Optional start date filter.
 * @param endDate Optional end date filter.
 * @returns A promise that resolves to an array of Attendance objects.
 */
export async function getStudentAttendance(
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<Attendance[]> {
  try {
    const db = getDb();
    const attendanceRef = collection(db, 'attendance');
    
    let q = query(
      attendanceRef,
      where('studentId', '==', studentId),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const records: Attendance[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const recordDate = data.date;
      
      // Apply date filters if provided
      if (startDate && recordDate < startDate) return;
      if (endDate && recordDate > endDate) return;
      
      records.push({
        id: doc.id,
        studentId: data.studentId,
        studentName: data.studentName,
        organizationId: data.organizationId,
        class: data.class,
        date: data.date,
        present: data.present,
        absenceReason: data.absenceReason,
        notes: data.notes,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      });
    });

    return records;
  } catch (error: any) {
    console.error(`Error fetching attendance for student ${studentId}:`, error);
    throw new Error(`Failed to fetch student attendance: ${error.message}`);
  }
}

/**
 * Asynchronously creates a new attendance record.
 *
 * @param attendance The attendance data to create (without id).
 * @returns A promise that resolves to the created Attendance object.
 */
export async function createAttendance(
  attendance: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Attendance> {
  try {
    const db = getDb();
    const attendanceRef = collection(db, 'attendance');

    const attendanceData = {
      ...attendance,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(attendanceRef, attendanceData);
    console.log(`Attendance record created with ID: ${docRef.id}`);

    const createdAttendance = await getAttendance(docRef.id);
    if (!createdAttendance) {
      throw new Error('Failed to retrieve created attendance record');
    }

    return createdAttendance;
  } catch (error: any) {
    console.error('Error creating attendance record:', error);
    throw new Error(`Failed to create attendance: ${error.message}`);
  }
}

/**
 * Asynchronously marks attendance for multiple students in bulk.
 *
 * @param organizationId The school ID.
 * @param date The date for the attendance (ISO string, date only).
 * @param attendanceData Array of bulk attendance data.
 * @returns A promise that resolves when all records are created/updated.
 */
export async function markBulkAttendance(
  organizationId: string,
  date: string,
  attendanceData: BulkAttendanceData[]
): Promise<void> {
  try {
    const db = getDb();
    const batch = writeBatch(db);

    for (const record of attendanceData) {
      // Create a composite ID based on studentId and date for idempotency
      const docId = `${record.studentId}_${date}`;
      const attendanceRef = doc(db, 'attendance', docId);

      batch.set(attendanceRef, {
        studentId: record.studentId,
        studentName: record.studentName,
        organizationId: organizationId,
        class: record.class,
        date: date,
        present: record.present,
        absenceReason: record.absenceReason || null,
        notes: record.notes || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true }); // Use merge to update if exists
    }

    await batch.commit();
    console.log(`Bulk attendance marked for ${attendanceData.length} students on ${date}`);
  } catch (error: any) {
    console.error('Error marking bulk attendance:', error);
    throw new Error(`Failed to mark bulk attendance: ${error.message}`);
  }
}

/**
 * Asynchronously updates an attendance record.
 *
 * @param id The attendance record's Firestore document ID.
 * @param updates Partial attendance data to update.
 * @returns A promise that resolves to the updated Attendance object.
 */
export async function updateAttendance(
  id: string,
  updates: Partial<Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Attendance> {
  try {
    const db = getDb();
    const attendanceRef = doc(db, 'attendance', id);

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(attendanceRef, updateData);
    console.log(`Attendance record ${id} updated successfully`);

    const updatedAttendance = await getAttendance(id);
    if (!updatedAttendance) {
      throw new Error('Failed to retrieve updated attendance record');
    }

    return updatedAttendance;
  } catch (error: any) {
    console.error(`Error updating attendance ${id}:`, error);
    throw new Error(`Failed to update attendance: ${error.message}`);
  }
}

/**
 * Asynchronously deletes an attendance record.
 *
 * @param id The attendance record's Firestore document ID.
 * @returns A promise that resolves when the record is deleted.
 */
export async function deleteAttendance(id: string): Promise<void> {
  try {
    const db = getDb();
    const attendanceRef = doc(db, 'attendance', id);
    
    await deleteDoc(attendanceRef);
    console.log(`Attendance record ${id} deleted successfully`);
  } catch (error: any) {
    console.error(`Error deleting attendance ${id}:`, error);
    throw new Error(`Failed to delete attendance: ${error.message}`);
  }
}
