'use server';
/**
 * @fileOverview Service functions for managing school data in Firestore.
 */

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, Timestamp, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

// Zod schema for validating new school data
export const NewSchoolSchema = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters long.'),
  // adminEmail: z.string().email('Invalid email address for school admin.').optional(), // For future use
});
export type NewSchoolData = z.infer<typeof NewSchoolSchema>;


/**
 * Represents a school as stored and retrieved.
 */
export interface School {
  /**
   * The unique identifier of the school (Firestore document ID).
   */
  id: string;
  /**
   * The name of the school.
   */
  name: string;
  /**
   * A generated license key for the school.
   */
  licenseKey: string;
  /**
   * The creation date of the school record (ISO string format).
   */
  createdAt: string;
  /**
   * Optional email for the school's primary admin.
   */
  adminEmail?: string;
}

/**
 * Represents the structure of a school document in Firestore.
 */
interface SchoolFirestoreDoc {
  name: string;
  licenseKey: string;
  createdAt: Timestamp;
  adminEmail?: string;
}

/**
 * Generates a simple license key.
 * Replace with a more robust generation logic if needed.
 */
function generateLicenseKey(): string {
  const prefix = 'CCP'; // CampusConnect Pro
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${randomPart}`;
}

/**
 * Asynchronously registers a new school in Firestore.
 * This function is a server action.
 * @param schoolData The data for the new school (name).
 * @returns A promise that resolves to the registered School object.
 * @throws Error if registration fails.
 */
export async function registerSchool(schoolData: NewSchoolData): Promise<School> {
  try {
    const newSchoolDoc: Omit<SchoolFirestoreDoc, 'createdAt'> & { createdAt: any } = {
      name: schoolData.name,
      licenseKey: generateLicenseKey(),
      createdAt: serverTimestamp(), // Firestore server-side timestamp
      // adminEmail: schoolData.adminEmail, // For future use
    };

    const docRef = await addDoc(collection(db, 'schools'), newSchoolDoc);
    
    // To return the full school object, we should fetch the document,
    // as serverTimestamp() is a sentinel value.
    // However, for simplicity in this step, we'll construct it client-side like.
    // A better approach would be to re-fetch or use the client-side estimated timestamp.
    // For now, we will return with a placeholder for createdAt or fetch it.

    const registeredDoc = await getDoc(doc(db, "schools", docRef.id));
    if (!registeredDoc.exists()) {
        throw new Error("Failed to retrieve newly registered school.");
    }
    const data = registeredDoc.data() as SchoolFirestoreDoc;

    return {
      id: registeredDoc.id,
      name: data.name,
      licenseKey: data.licenseKey,
      createdAt: data.createdAt.toDate().toISOString(),
      adminEmail: data.adminEmail,
    };
  } catch (error) {
    console.error('Error registering school:', error);
    // Consider more specific error handling or re-throwing a custom error
    throw new Error('Failed to register school. Please try again.');
  }
}

/**
 * Asynchronously retrieves all schools from Firestore.
 * This function is a server action.
 * @returns A promise that resolves to an array of School objects.
 */
export async function getSchools(): Promise<School[]> {
  try {
    const schoolsCol = collection(db, 'schools');
    const schoolSnapshot = await getDocs(schoolsCol);
    const schoolList = schoolSnapshot.docs.map(docSnap => {
      const data = docSnap.data() as SchoolFirestoreDoc;
      return {
        id: docSnap.id,
        name: data.name,
        licenseKey: data.licenseKey,
        createdAt: data.createdAt.toDate().toISOString(), // Convert Timestamp to ISO string
        adminEmail: data.adminEmail,
      };
    });
    return schoolList;
  } catch (error) {
    console.error('Error fetching schools:', error);
    return []; // Return empty array on error or re-throw
  }
}


/**
 * Asynchronously retrieves a school by its ID.
 * (Keeping the original getSchool function, can be enhanced or used later)
 * @param id The ID of the school to retrieve.
 * @returns A promise that resolves to a School object if found, or null if not found.
 */
export async function getSchoolById(id: string): Promise<School | null> {
 try {
    const schoolDocRef = doc(db, 'schools', id);
    const schoolSnap = await getDoc(schoolDocRef);

    if (schoolSnap.exists()) {
      const data = schoolSnap.data() as SchoolFirestoreDoc;
      return {
        id: schoolSnap.id,
        name: data.name,
        licenseKey: data.licenseKey,
        createdAt: data.createdAt.toDate().toISOString(),
        adminEmail: data.adminEmail,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching school with ID ${id}:`, error);
    return null;
  }
}
