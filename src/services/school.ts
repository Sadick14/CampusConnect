
'use server';
/**
 * @fileOverview Service functions for managing school data in Firestore.
 */

import { db, auth, storage } from '@/lib/firebase'; // Import storage
import { collection, addDoc, getDocs, Timestamp, doc, getDoc, serverTimestamp, query, where, writeBatch, FirestoreError, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Import storage functions
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'; // Import auth functions
import type { User } from './user'; // Import User type if needed for relationships
import { NewSchoolData } from '@/schemas/school'; // Import from the schema file
import { z } from 'zod';

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
  adminUid: string; // Changed to mandatory string
  /**
   * Optional physical address of the school.
   */
  address?: string | null;
   /**
    * Optional contact phone number for the school.
    */
  phone?: string | null;
  /**
   * Optional website URL for the school.
   */
  website?: string | null;
  /**
   * Optional URL for the school's logo image stored in Firebase Storage.
   */
  logoUrl?: string | null;
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
  adminUid: string; // Firebase Auth UID
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
}

// Zod schema for updating school profile information
export const UpdateSchoolProfileSchema = z.object({
  name: z.string().min(3, 'School name must be at least 3 characters long.').optional(), // Name might be editable later
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url('Invalid website URL.').or(z.literal('')).optional().nullable(), // Allow empty string or null
  // logoUrl is handled separately via file upload
});

export type UpdateSchoolProfileData = z.infer<typeof UpdateSchoolProfileSchema>;


/**
 * Generates a simple license key.
 */
function generateLicenseKey(): string {
  const prefix = 'CCP'; // CampusConnect Pro
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${randomPart}`;
}


/**
 * Asynchronously registers a new school in Firestore.
 * Creates the Firebase Auth user for the admin first, then creates the school and user profile docs.
 * @param schoolData The data for the new school including name, adminEmail, and adminPassword.
 * @returns A promise that resolves to the registered School object.
 * @throws Error if registration fails (e.g., auth creation fails, email exists, permission denied).
 */
export async function registerSchool(schoolData: NewSchoolData): Promise<School> {
    // 1. Create Firebase Auth User
    let adminAuthUid: string;
    try {
        // IMPORTANT: This uses client-side SDK. For production, it's STRONGLY recommended
        // to use a backend function (e.g., Firebase Cloud Function) with the Admin SDK
        // to create users securely without exposing the admin's password client-side.
        console.log(`Attempting to create Auth user for ${schoolData.adminEmail}...`);
        const userCredential = await createUserWithEmailAndPassword(auth, schoolData.adminEmail, schoolData.adminPassword);
        adminAuthUid = userCredential.user.uid;
        console.log(`Auth user created successfully with UID: ${adminAuthUid}`);

        // Optionally set display name immediately
        try {
             await updateProfile(userCredential.user, { displayName: `${schoolData.name} Admin` });
             console.log(`Set display name for Auth user ${adminAuthUid}.`);
        } catch (profileError) {
            console.warn(`Could not set display name for Auth user ${adminAuthUid}:`, profileError);
            // Non-critical, continue registration
        }

    } catch (error: any) {
        console.error('Error creating Firebase Auth user:', error);
        if (error.code === 'auth/email-already-in-use') {
            throw new Error(`Authentication failed: The email address ${schoolData.adminEmail} is already in use by another account.`);
        } else if (error.code === 'auth/weak-password') {
            throw new Error('Authentication failed: The password is too weak.');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('Authentication failed: The email address is not valid.');
        }
        // Handle other potential auth errors (network, etc.)
        throw new Error(`Failed to create admin authentication account: ${error.message}`);
    }

    // --- Create/Update Firestore Documents using Batch ---
    const batch = writeBatch(db);
    const newSchoolDocRef = doc(collection(db, 'schools')); // Auto-generate school ID
    const adminProfileDocRef = doc(db, 'users', adminAuthUid); // Use Auth UID as Firestore doc ID

    // 2. Prepare School Document Data
    const schoolDbData: Omit<SchoolFirestoreDoc, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        name: schoolData.name,
        licenseKey: generateLicenseKey(),
        adminEmail: schoolData.adminEmail,
        adminUid: adminAuthUid, // Store the Auth UID
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
         // Initialize optional fields as null
        address: null,
        phone: null,
        website: null,
        logoUrl: null,
    };
    batch.set(newSchoolDocRef, schoolDbData);

    // 3. Prepare Admin User Profile Data (Create or Merge)
    const adminProfileData: Partial<Omit<User, 'id'>> & { createdAt?: any, updatedAt: any } = {
        name: `${schoolData.name} Admin`, // Set display name
        email: schoolData.adminEmail,
        role: 'school_admin',
        schoolId: newSchoolDocRef.id, // Link to the new school ID
        schoolName: schoolData.name,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(), // Let Firestore handle this on creation
    };

    // Clean data to avoid undefined values
    const cleanAdminProfileData = Object.entries(adminProfileData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            acc[key as keyof typeof adminProfileData] = value;
        }
        return acc;
    }, {} as { [key: string]: any });

    // Use set with merge: true to create OR update (in case profile somehow pre-existed, unlikely here)
    batch.set(adminProfileDocRef, cleanAdminProfileData, { merge: true });

    // --- Commit Batch ---
    try {
        await batch.commit();
        console.log(`School ${schoolData.name} registered with ID: ${newSchoolDocRef.id}`);
        console.log(`Admin profile created/linked for ${schoolData.adminEmail} using Auth UID: ${adminAuthUid}`);

        // Fetch the school doc to return complete data
        const registeredDocSnap = await getDoc(newSchoolDocRef);
        if (!registeredDocSnap.exists()) {
            // Attempt to clean up potentially created Auth user? Difficult to handle atomically.
            console.error("CRITICAL: Failed to retrieve newly registered school after batch write, but Auth user might exist.");
            throw new Error("Failed to verify school creation after batch write.");
        }
        const finalSchoolData = registeredDocSnap.data() as SchoolFirestoreDoc;

        return {
            id: registeredDocSnap.id,
            name: finalSchoolData.name,
            licenseKey: finalSchoolData.licenseKey,
            createdAt: finalSchoolData.createdAt.toDate().toISOString(),
            updatedAt: finalSchoolData.updatedAt.toDate().toISOString(),
            adminEmail: finalSchoolData.adminEmail,
            adminUid: finalSchoolData.adminUid, // Return the Auth UID
             // Return optional fields as null if missing
            address: finalSchoolData.address ?? null,
            phone: finalSchoolData.phone ?? null,
            website: finalSchoolData.website ?? null,
            logoUrl: finalSchoolData.logoUrl ?? null,
        };

    } catch (error: any) {
        console.error('Error committing school and admin profile batch:', error);
        // Attempt to clean up potentially created Auth user? Very tricky.
        // For now, log the critical state. Manual cleanup might be needed.
        console.error(`CRITICAL: Failed to commit Firestore batch for school ${schoolData.name}. Auth user ${adminAuthUid} may exist without linked profile/school.`);
        if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
            throw new Error("Cannot complete registration: Client is offline during Firestore commit.");
        }
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            throw new Error("Permission denied while saving school/profile data. Check Firestore rules.");
        }
        throw new Error(`Failed to save school/profile data. Please try again. ${error.message}`);
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
        address: data.address ?? null,
        phone: data.phone ?? null,
        website: data.website ?? null,
        logoUrl: data.logoUrl ?? null,
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
        address: data.address ?? null,
        phone: data.phone ?? null,
        website: data.website ?? null,
        logoUrl: data.logoUrl ?? null,
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

/**
 * Updates a school's profile information in Firestore and optionally uploads a new logo.
 * Only callable by the school's admin.
 * @param schoolId The ID of the school to update.
 * @param data The data to update (address, phone, website).
 * @param logoFile The new logo file to upload (optional).
 * @param currentAdminUid The UID of the admin performing the update.
 * @returns A promise that resolves to the updated School object.
 */
export async function updateSchoolProfile(
  schoolId: string,
  data: UpdateSchoolProfileData,
  logoFile: File | null,
  currentAdminUid: string
): Promise<School> {
  const schoolDocRef = doc(db, 'schools', schoolId);

  try {
    // 1. Verify Admin Permissions
    const schoolSnap = await getDoc(schoolDocRef);
    if (!schoolSnap.exists()) {
      throw new Error('School not found.');
    }
    const existingSchoolData = schoolSnap.data() as SchoolFirestoreDoc;
    if (existingSchoolData.adminUid !== currentAdminUid) {
      throw new Error('Permission denied: Only the assigned admin can update this school.');
    }

    const updateData: Partial<SchoolFirestoreDoc> & { updatedAt: any } = {
      updatedAt: serverTimestamp(),
    };

    // Add provided fields to updateData if they exist
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.name !== undefined) updateData.name = data.name; // Allow name update if provided

    // 2. Handle Logo Upload (if provided)
    let newLogoUrl: string | null = existingSchoolData.logoUrl ?? null;
    if (logoFile) {
      console.log(`Uploading new logo for school ${schoolId}...`);
      const fileExtension = logoFile.name.split('.').pop();
      const logoFileName = `logo.${fileExtension}`;
      const logoStorageRef = ref(storage, `school-logos/${schoolId}/${logoFileName}`);

      // Delete previous logo if it exists
      if (existingSchoolData.logoUrl) {
        try {
          const oldLogoRef = ref(storage, existingSchoolData.logoUrl);
          await deleteObject(oldLogoRef);
          console.log(`Deleted previous logo for school ${schoolId}`);
        } catch (deleteError: any) {
          // Log error but continue - maybe the old URL was invalid
          console.warn(`Could not delete previous logo (${existingSchoolData.logoUrl}): ${deleteError.message}`);
        }
      }

      // Upload the new logo
      const uploadResult = await uploadBytes(logoStorageRef, logoFile);
      newLogoUrl = await getDownloadURL(uploadResult.ref);
      updateData.logoUrl = newLogoUrl; // Add the new URL to the Firestore update
      console.log(`Logo uploaded successfully for school ${schoolId}. URL: ${newLogoUrl}`);
    }

    // 3. Update Firestore Document
    await updateDoc(schoolDocRef, updateData);
    console.log(`School profile updated successfully for ID: ${schoolId}`);

    // 4. Fetch and return the updated school data
    const updatedSnap = await getDoc(schoolDocRef);
    if (!updatedSnap.exists()) {
      // Should not happen after successful update, but handle defensively
      throw new Error('Failed to retrieve updated school profile after saving.');
    }
    const finalData = updatedSnap.data() as SchoolFirestoreDoc;
    return {
      id: updatedSnap.id,
      name: finalData.name,
      licenseKey: finalData.licenseKey,
      createdAt: finalData.createdAt instanceof Timestamp ? finalData.createdAt.toDate().toISOString() : new Date(0).toISOString(),
      updatedAt: finalData.updatedAt instanceof Timestamp ? finalData.updatedAt.toDate().toISOString() : new Date(0).toISOString(),
      adminEmail: finalData.adminEmail,
      adminUid: finalData.adminUid,
      address: finalData.address ?? null,
      phone: finalData.phone ?? null,
      website: finalData.website ?? null,
      logoUrl: finalData.logoUrl ?? null, // Ensure logoUrl is included
    };

  } catch (error: any) {
    console.error(`Error updating school profile for ID ${schoolId}:`, error);
     if (error instanceof FirestoreError && (error.code === 'unavailable' || error.message.includes("offline"))) {
       throw new Error("Cannot update school profile: Client is offline.");
     }
     if (error instanceof FirestoreError && error.code === 'permission-denied') {
        throw new Error("Permission denied updating school profile. Check Firestore rules.");
     }
     if (error.code?.startsWith('storage/')) { // Handle storage errors
        throw new Error(`Failed to update school logo: ${error.message}`);
     }
    throw new Error(`Failed to update school profile: ${error.message}`);
  }
}
