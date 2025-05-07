
'use server';
/**
 * @fileOverview Service functions for managing school data in Firestore.
 */

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, Timestamp, doc, getDoc, serverTimestamp, query, where, writeBatch, FirestoreError, updateDoc, setDoc } from 'firebase/firestore';
import type { User } from './user'; // Import User type if needed for relationships
import { NewSchoolData } from '@/schemas/school'; // Import from the new schema file

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
   * UID of the school's primary admin (Firebase Auth UID / Firestore user document ID).
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
  adminUid?: string; // This will be the Firebase Auth UID
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
 * Asynchronously registers a new school in Firestore and creates/links the admin user profile.
 * Requires the Firebase Auth user for the admin to be created MANUALLY beforehand.
 * @param schoolData The data for the new school including name, adminEmail, and adminUid (Firebase Auth UID).
 * @returns A promise that resolves to the registered School object.
 * @throws Error if registration fails.
 */
export async function registerSchool(schoolData: NewSchoolData): Promise<School> {
    if (!schoolData.adminUid) {
        throw new Error("Admin Auth UID is required but was not provided.");
    }

  // --- Pre-checks ---
  try {
    const usersRef = collection(db, 'users');

    // 1. Check if a user profile already exists with the provided adminUid
    const adminProfileDocRef = doc(db, 'users', schoolData.adminUid);
    const existingProfileSnap = await getDoc(adminProfileDocRef);
    if (existingProfileSnap.exists()) {
        const existingProfileData = existingProfileSnap.data();
        if (existingProfileData.email !== schoolData.adminEmail) {
            throw new Error(`User UID ${schoolData.adminUid} already exists but is linked to a different email (${existingProfileData.email}).`);
        }
        if (existingProfileData.role === 'school_admin' && existingProfileData.schoolId) {
             throw new Error(`User profile with UID ${schoolData.adminUid} is already an admin for school ${existingProfileData.schoolId}.`);
        }
        if (existingProfileData.role === 'superadmin') {
             throw new Error(`User profile with UID ${schoolData.adminUid} is a superadmin and cannot be assigned as a school admin.`);
        }
         // Allow linking if UID exists but isn't a school admin or superadmin yet.
         console.log(`User profile with UID ${schoolData.adminUid} exists. Will update role and link to new school.`);
    }


    // 2. Check if another user profile exists with the provided adminEmail (but different UID)
    const qEmail = query(usersRef, where('email', '==', schoolData.adminEmail));
    const existingEmailSnap = await getDocs(qEmail);
    if (!existingEmailSnap.empty) {
        let emailConflict = false;
        existingEmailSnap.forEach(doc => {
            // Conflict if an existing doc with this email has a DIFFERENT UID
            if (doc.id !== schoolData.adminUid) {
                emailConflict = true;
                console.error(`Email conflict: ${schoolData.adminEmail} is already used by user UID ${doc.id}.`);
            }
        });
        if (emailConflict) {
            throw new Error(`The email ${schoolData.adminEmail} is already associated with a different user profile.`);
        }
    }

    // 3. Check if a school already has this user assigned as admin
    const schoolsRef = collection(db, 'schools');
    const qSchoolAdmin = query(schoolsRef, where('adminUid', '==', schoolData.adminUid));
    const existingSchoolAdminSnap = await getDocs(qSchoolAdmin);
     if (!existingSchoolAdminSnap.empty) {
        const assignedSchool = existingSchoolAdminSnap.docs[0].data().name;
       throw new Error(`User UID ${schoolData.adminUid} is already assigned as the admin for school "${assignedSchool}".`);
     }


  } catch (error: any) {
      if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
          throw new Error("Cannot perform pre-registration checks: Client is offline.");
      }
       if (error instanceof Error) { // Re-throw specific errors caught above
         throw error;
       }
      console.error("Error during pre-registration checks:", error);
      throw new Error("Failed pre-registration checks. Please try again.");
  }

  // --- Create/Update Documents ---
  const batch = writeBatch(db);
  const newSchoolDocRef = doc(collection(db, 'schools'));
  // Use the PROVIDED adminUid as the document ID for the user profile
  const adminProfileDocRef = doc(db, 'users', schoolData.adminUid);

  // School Document Data
  const schoolDbData: Omit<SchoolFirestoreDoc, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
    name: schoolData.name,
    licenseKey: generateLicenseKey(),
    adminEmail: schoolData.adminEmail,
    adminUid: schoolData.adminUid, // Use the provided Auth UID
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  batch.set(newSchoolDocRef, schoolDbData);

  // Admin User Profile Data (Create or Merge)
  // If the profile exists, we merge; otherwise, we create. set with merge:true handles both.
  const adminProfileData: Partial<Omit<User, 'id'>> & { createdAt?: any, updatedAt: any } = {
      name: `${schoolData.name} Admin`, // Default name, can be updated later
      email: schoolData.adminEmail,
      role: 'school_admin', // Set the role
      schoolId: newSchoolDocRef.id, // Link to the new school ID
      schoolName: schoolData.name, // Denormalize school name
      updatedAt: serverTimestamp(),
      // Only set createdAt if the document doesn't exist (Firestore handles this with merge:true implicitly kinda, but safer to check)
      // However, setDoc with merge handles this. If creating, it adds createdAt. If merging, it leaves existing createdAt.
      createdAt: serverTimestamp(), // Let Firestore handle setting this on creation
  };

   // Clean data to avoid undefined values for Firestore
  const cleanAdminProfileData = Object.entries(adminProfileData).reduce((acc, [key, value]) => {
    // We allow null for schoolId/schoolName explicitly if needed, but here we set them
     if (value !== undefined) {
         acc[key as keyof typeof adminProfileData] = value;
     }
    return acc;
  }, {} as { [key: string]: any });


  // Use set with merge: true to create OR update the profile document
  batch.set(adminProfileDocRef, cleanAdminProfileData, { merge: true });


  // --- Commit Batch ---
  try {
    await batch.commit();
    console.log(`School ${schoolData.name} registered with ID: ${newSchoolDocRef.id}`);
    console.log(`Admin profile linked/created for ${schoolData.adminEmail} using Auth UID: ${schoolData.adminUid}`);

    // Fetch the school doc to return complete data
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
      adminUid: finalSchoolData.adminUid, // Return the UID used
    };

  } catch (error: any) {
    console.error('Error committing school and admin profile batch:', error);
    if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
        throw new Error("Cannot complete registration: Client is offline.");
    }
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      throw new Error("Permission denied while registering school. Check Firestore rules.");
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
        // Handle potential missing timestamps gracefully
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date(0).toISOString(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date(0).toISOString(),
        adminEmail: data.adminEmail,
        adminUid: data.adminUid,
      };
    });
    return schoolList;
  }  catch (error: any) {
    console.error('Error fetching schools:', error);
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
      console.error("Permission denied while fetching schools. Ensure you have the necessary permissions.");
      throw new Error("Permission denied fetching schools.");
    }
     if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
      console.warn("Failed to fetch schools because the client is offline. Returning empty list.");
      return [];
    }
     if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
      console.error("Firestore rules error: Missing or insufficient permissions to fetch schools.");
       throw new Error("Permission denied fetching schools.");
    }
     console.error("An unexpected error occurred while fetching schools.");
     return [];
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
         // Handle potential missing timestamps gracefully
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date(0).toISOString(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : new Date(0).toISOString(),
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
     if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
      console.warn(`Failed to fetch school with ID ${id} because the client is offline.`);
      // Consider throwing an error or returning a specific offline indicator
      return null;
    }
    return null;
  }
}
