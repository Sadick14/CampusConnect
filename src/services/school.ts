'use server';
/**
 * @fileOverview Service functions for managing school data in Firestore.
 */

import { db } from '@/lib/firebase'; 
import { collection, addDoc, getDocs, Timestamp, doc, getDoc, serverTimestamp, query, where, writeBatch, FirestoreError, updateDoc } from 'firebase/firestore';
// import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'; // For creating user, handled manually
import { z } from 'zod';
import { createUserProfile } from './user'; 

// Zod schema for validating new school data
export const NewSchoolSchema = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters long.'),
  adminEmail: z.string().email('Invalid email address for school admin.'),
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
   * The last update date of the school record (ISO string format).
   */
  updatedAt: string;
  /**
   * Email for the school's primary admin.
   */
  adminEmail: string; 
  /**
   * UID of the school's primary admin (Firestore user document ID).
   */
  adminUid?: string;
}

/**
 * Represents the structure of a school document in Firestore.
 */
interface SchoolFirestoreDoc {
  name: string;
  licenseKey: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  adminEmail: string; 
  adminUid?: string; // This will be the Firestore document ID of the admin user profile
}

/**
 * Generates a simple license key.
 */
function generateLicenseKey(): string {
  const prefix = 'CCP'; // CampusConnect Pro
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${randomPart}`;
}

/**
 * Asynchronously registers a new school in Firestore and creates a placeholder admin user profile.
 * The Firebase Auth user for the admin MUST be created manually.
 * @param schoolData The data for the new school (name, adminEmail).
 * @returns A promise that resolves to the registered School object.
 * @throws Error if registration fails.
 */
export async function registerSchool(schoolData: NewSchoolData): Promise<School> {
  try {
    const usersRef = collection(db, 'users');
    // Check if a user profile with this email already exists and is a school_admin for *another* school
    const qAdmin = query(usersRef, where('email', '==', schoolData.adminEmail), where('role', '==', 'school_admin'));
    const existingAdminSnap = await getDocs(qAdmin);

    if (!existingAdminSnap.empty) {
       // A school_admin profile with this email already exists.
       // This is only a conflict if it's for a different school or if we strictly enforce one school_admin profile per email.
       // For now, we'll throw an error to prevent duplicates.
       throw new Error(`An admin profile with email ${schoolData.adminEmail} already exists.`);
    }
    // Also check if a superadmin exists with this email
     const qSuperAdmin = query(usersRef, where('email', '==', schoolData.adminEmail), where('role', '==', 'superadmin'));
     const existingSuperAdminSnap = await getDocs(qSuperAdmin);
     if (!existingSuperAdminSnap.empty) {
       throw new Error(`Cannot assign ${schoolData.adminEmail} as school admin; it's already a superadmin email.`);
     }


  } catch (error: any) {
      if (error instanceof Error && error.message.includes("already exists")) {
          throw error; // Re-throw specific error
      }
      console.error("Error during admin email existence check:", error);
      throw new Error("Failed to check existing admin. Please try again.");
  }

  const batch = writeBatch(db);
  const newSchoolDocRef = doc(collection(db, 'schools'));
  const adminProfileDocRef = doc(collection(db, 'users')); // Generate ID for the profile doc

  const schoolDbData: Omit<SchoolFirestoreDoc, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
    name: schoolData.name,
    licenseKey: generateLicenseKey(),
    adminEmail: schoolData.adminEmail,
    adminUid: adminProfileDocRef.id, // Link school to the admin profile ID
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  batch.set(newSchoolDocRef, schoolDbData);

  // Create the Firestore user profile document for the admin
  const adminProfileData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
      name: `${schoolData.name} Admin`, // Default name
      email: schoolData.adminEmail,
      role: 'school_admin',
      schoolId: newSchoolDocRef.id,
      schoolName: schoolData.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
  };
  batch.set(adminProfileDocRef, adminProfileData);

  try {
    await batch.commit();
    console.log(`School ${schoolData.name} registered with ID: ${newSchoolDocRef.id}`);
    console.log(`Admin profile created for ${schoolData.adminEmail} with Firestore ID: ${adminProfileDocRef.id}`);
    console.warn(`IMPORTANT: Manually create Firebase Auth user for ${schoolData.adminEmail} with UID matching the Firestore profile ID: ${adminProfileDocRef.id}`);
    
    const registeredDocSnap = await getDoc(newSchoolDocRef);
    if (!registeredDocSnap.exists()) {
        throw new Error("Failed to retrieve newly registered school after batch write.");
    }
    const finalSchoolData = registeredDocSnap.data() as SchoolFirestoreDoc;

    return {
      id: registeredDocSnap.id,
      name: finalSchoolData.name,
      licenseKey: finalSchoolData.licenseKey,
      createdAt: finalSchoolData.createdAt.toDate().toISOString(),
      updatedAt: finalSchoolData.updatedAt.toDate().toISOString(),
      adminEmail: finalSchoolData.adminEmail,
      adminUid: finalSchoolData.adminUid,
    };

  } catch (error: any) {
    console.error('Error committing school and admin profile batch:', error);
    if (error instanceof Error && error.message.includes("already exists")) {
        throw error; 
    }
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      throw new Error("Permission denied while registering school. Ensure you have the necessary permissions.");
    }
    if (error instanceof Error && error.message.includes("offline")) {
      throw new Error("Failed to register school because the client is offline.");
    }
    throw new Error(`Failed to register school. Please try again. ${error.message}`);
  }
}

/**
 * Asynchronously retrieves all schools from Firestore.
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
        createdAt: data.createdAt.toDate().toISOString(),
        updatedAt: data.updatedAt.toDate().toISOString(),
        adminEmail: data.adminEmail,
        adminUid: data.adminUid,
      };
    });
    return schoolList;
  }  catch (error: any) {
    console.error('Error fetching schools:', error);
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
      console.error("Permission denied while fetching schools. Ensure you have the necessary permissions.");
      return []; 
    }
     if (error instanceof Error && error.message.includes("offline")) {
      console.error("Failed to fetch schools because the client is offline.");
      return [];
    }
     if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
      console.error("Firestore rules error: Missing or insufficient permissions to fetch schools.");
       // Depending on policy, you might want to throw an error here
       // to signal the caller that the operation failed due to permissions.
       throw new Error("Permission denied fetching schools.");
      // return []; // Or return empty if that's acceptable
    }
    // Rethrow other errors or return empty based on policy
    // throw error; // Rethrow unexpected errors
    return []; // Default to empty on other errors
  }
}


/**
 * Asynchronously retrieves a school by its ID.
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
        updatedAt: data.updatedAt.toDate().toISOString(),
        adminEmail: data.adminEmail,
        adminUid: data.adminUid,
      };
    } else {
      return null;
    }
  } catch (error: any) {
    console.error(`Error fetching school with ID ${id}:`, error);
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
      console.error("Permission denied while fetching school. Ensure you have the necessary permissions.");
      return null;
    }
     if (error instanceof Error && error.message.includes("offline")) {
      console.error("Failed to fetch school because the client is offline.");
      return null;
    }
    return null;
  }
}