
'use server';
/**
 * @fileOverview Service functions for managing school data in Firestore.
 */

import { db, auth as firebaseAuth } from '@/lib/firebase'; // Import firebaseAuth
import { collection, addDoc, getDocs, Timestamp, doc, getDoc, serverTimestamp, query, where, writeBatch, FirestoreError } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'; // For creating user
import { z } from 'zod';
import { createUserProfile } from './user'; // For creating user profile in Firestore

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
   * Email for the school's primary admin.
   */
  adminEmail: string; // Made mandatory
  /**
   * UID of the school's primary admin.
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
  adminEmail: string; // Made mandatory
  adminUid?: string;
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
 * Generates a random temporary password.
 */
function generateTemporaryPassword(): string {
  return Math.random().toString(36).slice(-8);
}


/**
 * Asynchronously registers a new school in Firestore and creates an admin user.
 * This function is a server action.
 * @param schoolData The data for the new school (name, adminEmail).
 * @returns A promise that resolves to the registered School object.
 * @throws Error if registration fails (e.g., admin email already in use by another admin).
 */
export async function registerSchool(schoolData: NewSchoolData): Promise<School> {
  // Check if an admin with this email already exists for another school
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', schoolData.adminEmail), where('role', '==', 'school_admin'));
    const existingAdminSnap = await getDocs(q);

    if (!existingAdminSnap.empty) {
      // Check if any of these existing admins are tied to a *different* school or no school (which shouldn't happen for school_admin)
      // This check can be more robust, e.g. by checking if the schoolId matches if we were updating.
      // For new registration, any existing 'school_admin' with this email is a conflict.
      throw new Error(`An admin account with email ${schoolData.adminEmail} already exists for another school.`);
    }
  } catch (error: any) {
      console.error("Error during admin email existence check:", error);
      throw new Error("Failed to check existing admin. Please try again.");
  }

  const tempPassword = generateTemporaryPassword();
  let adminUserUid: string | undefined;

  try {
    // Create Firebase Auth user for the admin
    // This part needs to be handled carefully. Firebase Admin SDK is needed for direct user creation on the server.
    // If running this purely client-side (which 'use server' actions CAN be), this approach is problematic without Admin SDK.
    // For now, we assume this 'use server' can somehow make privileged calls or this is a conceptual step.
    // A more secure flow for client-side initiation:
    // 1. Superadmin creates school doc.
    // 2. Superadmin triggers a Firebase Function (or separate admin process) to create the auth user.
    // For simplicity, let's proceed as if it's possible, but acknowledge the limitation.
    
    // --> Placeholder for actual Firebase Auth user creation.
    // --> In a real app, use Firebase Admin SDK in a Cloud Function triggered after school doc creation.
    // --> Or, if superadmin is creating this via an admin panel where they are already authenticated with sufficient privileges.

    // Conceptual:
    // const userCredential = await createUserWithEmailAndPassword(firebaseAuth, schoolData.adminEmail, tempPassword);
    // adminUserUid = userCredential.user.uid;
    // await sendPasswordResetEmail(firebaseAuth, schoolData.adminEmail); // Or send temp password via other means

    // Since direct auth user creation from a Next.js server action without Admin SDK is complex/insecure for general users,
    // we'll simulate the UID part and focus on Firestore data.
    // In a real scenario, the adminUid would come from the actual auth user creation.
    // We will skip Firebase Auth user creation here and only create the Firestore school document and user profile document.
    // The superadmin would need to manually create the auth user or use a separate secure mechanism.
    console.warn("Skipping Firebase Auth user creation in registerSchool. This needs a secure server-side implementation (e.g., Firebase Functions with Admin SDK).");


    const batch = writeBatch(db);

    const newSchoolDocRef = doc(collection(db, 'schools'));
    const schoolDbData: Omit<SchoolFirestoreDoc, 'createdAt' | 'adminUid'> &amp; { createdAt: any, adminUid?: string } = {
      name: schoolData.name,
      licenseKey: generateLicenseKey(),
      adminEmail: schoolData.adminEmail,
      // adminUid will be set after Auth user is created (conceptually)
      createdAt: serverTimestamp(),
    };
    
    // If adminUserUid was successfully created (conceptually)
    // schoolDbData.adminUid = adminUserUid; 
    
    batch.set(newSchoolDocRef, schoolDbData);
    
    // Create user profile for the admin (conceptually, if adminUserUid was available)
    // if (adminUserUid) {
    //   await createUserProfile(
    //     { uid: adminUserUid, email: schoolData.adminEmail, displayName: `${schoolData.name} Admin` } as any, // Cast as any to fit FirebaseUser type for createUserProfile
    //     { role: 'school_admin', schoolId: newSchoolDocRef.id, schoolName: schoolData.name }
    //   );
    // } else {
       // If auth user creation is skipped, still create a user profile doc with a placeholder or pre-defined ID
       // This is NOT ideal. The UID should come from Firebase Auth.
       const placeholderAdminId = `admin_${newSchoolDocRef.id}`; // Example placeholder
       const adminProfileRef = doc(db, 'users', placeholderAdminId);
       batch.set(adminProfileRef, {
         id: placeholderAdminId,
         email: schoolData.adminEmail,
         displayName: `${schoolData.name} Admin`,
         role: 'school_admin',
         schoolId: newSchoolDocRef.id,
         schoolName: schoolData.name,
         // Note: This user won't be able to log in without a corresponding Firebase Auth account.
       });
       schoolDbData.adminUid = placeholderAdminId; // Link the placeholder ID
       // Update the school doc with the placeholder adminUid
       batch.update(newSchoolDocRef, { adminUid: placeholderAdminId });

    // }


    await batch.commit();
    
    // Fetch the created school document to get the server timestamp
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
      adminEmail: finalSchoolData.adminEmail,
      adminUid: finalSchoolData.adminUid,
    };

  } catch (error: any) {
    console.error('Error registering school:', error);
    if (error instanceof Error &amp;&amp; error.message.includes("already exists")) {
        throw error; // Re-throw specific error
    }
    if (error instanceof FirestoreError &amp;&amp; error.code === 'permission-denied') {
      throw new Error("Permission denied while registering school. Ensure you have the necessary permissions.");
    }
    if (error instanceof Error &amp;&amp; error.message.includes("offline")) {
      throw new Error("Failed to register school because the client is offline.");
    }
    throw new Error(`Failed to register school. Please try again. ${error.message}`);
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
        createdAt: data.createdAt.toDate().toISOString(),
        adminEmail: data.adminEmail,
        adminUid: data.adminUid,
      };
    });
    return schoolList;
  }  catch (error: any) {
    console.error('Error fetching schools:', error);
     if (error instanceof FirestoreError &amp;&amp; error.code === 'permission-denied') {
      console.error("Permission denied while fetching schools. Ensure you have the necessary permissions.");
      return []; // Or throw an error, depending on desired behavior
    }
     if (error instanceof Error &amp;&amp; error.message.includes("offline")) {
      console.error("Failed to fetch schools because the client is offline.");
      return [];
    }
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
        createdAt: data.createdAt.toDate().toISOString(),
        adminEmail: data.adminEmail,
        adminUid: data.adminUid,
      };
    } else {
      return null;
    }
  } catch (error: any) {
    console.error(`Error fetching school with ID ${id}:`, error);
     if (error instanceof FirestoreError &amp;&amp; error.code === 'permission-denied') {
      console.error("Permission denied while fetching school. Ensure you have the necessary permissions.");
      return null;
    }
     if (error instanceof Error &amp;&amp; error.message.includes("offline")) {
      console.error("Failed to fetch school because the client is offline.");
      return null;
    }
    return null;
  }
}
