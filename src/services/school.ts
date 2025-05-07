'use server';
/**
 * @fileOverview Service functions for managing school data.
 * WARNING: Currently uses TEMPORARY In-Memory storage. Not for production.
 */

// Remove Firestore imports
// import { collection, addDoc, getDocs, Timestamp, doc, getDoc, serverTimestamp, query, where, writeBatch, FirestoreError, updateDoc, setDoc } from 'firebase/firestore';
// import { getDb } from '@/lib/firebase';
import { auth, storage } from '@/lib/firebase'; // Keep Auth and Storage
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

// Import types from schemas
import {
    type School,
    type NewSchoolData,
    type UpdateSchoolProfileData
} from '@/schemas/school';
import type { User } from '@/schemas/user';

// Import in-memory store functions
import {
    addSchoolToMemory,
    getSchoolFromMemory,
    getAllSchoolsFromMemory,
    updateSchoolInMemory,
    addUserToMemory, // For adding the admin user
    getUserFromMemory,
    updateUserInMemory,
    setUserInMemory,
    getUserByEmailFromMemory
} from '@/lib/in-memory-db';

console.warn('School Service: Using TEMPORARY In-Memory Database.');


/**
 * Generates a simple license key.
 */
function generateLicenseKey(): string {
  const prefix = 'CCP'; // CampusConnect Pro
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${randomPart}`;
}


/**
 * Asynchronously registers a new school using the in-memory store.
 * Creates the Firebase Auth user, then adds school and user profile to memory.
 * @param schoolData The data for the new school including name, adminEmail, and adminPassword.
 * @returns A promise that resolves to the registered School object.
 * @throws Error if registration fails (e.g., auth creation fails, email exists).
 */
export async function registerSchool(schoolData: NewSchoolData): Promise<School> {
    // 1. Create Firebase Auth User (Remains the same)
    let adminAuthUid: string;
    try {
        // Check if email exists in memory first (basic check)
        if (getUserByEmailFromMemory(schoolData.adminEmail)) {
             throw new Error(`Registration failed: The email address ${schoolData.adminEmail} is already associated with a profile in the in-memory store.`);
        }
        console.log(`Attempting to create Auth user for ${schoolData.adminEmail}...`);
        const userCredential = await createUserWithEmailAndPassword(auth, schoolData.adminEmail, schoolData.adminPassword);
        adminAuthUid = userCredential.user.uid;
        console.log(`Auth user created successfully with UID: ${adminAuthUid}`);

        try {
             await updateProfile(userCredential.user, { displayName: `${schoolData.name} Admin` });
             console.log(`Set display name for Auth user ${adminAuthUid}.`);
        } catch (profileError) {
            console.warn(`Could not set display name for Auth user ${adminAuthUid}:`, profileError);
        }
    } catch (error: any) {
        console.error('Error creating Firebase Auth user:', error);
        if (error.code === 'auth/email-already-in-use') {
            throw new Error(`Authentication failed: The email address ${schoolData.adminEmail} is already in use by another account.`);
        } // ... other auth errors
        throw new Error(`Failed to create admin authentication account: ${error.message}`);
    }

    // --- Add School and User to In-Memory Store ---
    try {
        // 2. Prepare and Add School to Memory
        const schoolToAdd: Omit<School, 'id' | 'createdAt' | 'updatedAt'> = {
            name: schoolData.name,
            licenseKey: generateLicenseKey(),
            adminEmail: schoolData.adminEmail,
            adminUid: adminAuthUid,
            address: null,
            phone: null,
            website: null,
            logoUrl: null,
        };
        // addSchoolToMemory generates ID and timestamps
        const newSchool = addSchoolToMemory(schoolToAdd);

        // 3. Prepare and Add Admin User Profile to Memory
        const adminProfileToAdd: Omit<User, 'createdAt' | 'updatedAt'> & { id: string } = {
            id: adminAuthUid, // Use Auth UID as ID
            name: `${schoolData.name} Admin`,
            email: schoolData.adminEmail,
            role: 'school_admin',
            schoolId: newSchool.id,
            schoolName: newSchool.name,
            schoolLogoUrl: newSchool.logoUrl, // Initially null
            class: null,
            parentContact: null,
        };
        // addUserToMemory adds timestamps
        addUserToMemory(adminProfileToAdd);

        console.log(`School ${schoolData.name} registered in-memory with ID: ${newSchool.id}`);
        console.log(`Admin profile created in-memory for ${schoolData.adminEmail} using Auth UID: ${adminAuthUid}`);

        return newSchool; // Return the school data created in memory

    } catch (error: any) {
        console.error('Error adding school/admin profile to in-memory store:', error);
        // Attempt to clean up potentially created Auth user? Tricky.
        console.error(`CRITICAL: Failed to add data to in-memory store for school ${schoolData.name}. Auth user ${adminAuthUid} may exist without linked profile/school.`);
        throw new Error(`Failed to save school/profile data in memory. Please try again. ${error.message}`);
    }
}


/**
 * Asynchronously retrieves all schools from the in-memory store.
 * @returns A promise that resolves to an array of School objects.
 */
export async function getSchools(): Promise<School[]> {
  try {
    // Simulate async operation if needed, otherwise just return
    await Promise.resolve(); // Placeholder for potential async ops later
    const schoolList = getAllSchoolsFromMemory();
    return schoolList;
  }  catch (error: any) {
    console.error('Error fetching schools from memory:', error);
    return [];
  }
}


/**
 * Asynchronously retrieves a school by its ID from the in-memory store.
 * @param id The ID of the school to retrieve.
 * @returns A promise that resolves to a School object if found, or null if not found.
 */
export async function getSchoolById(id: string): Promise<School | null> {
 try {
    await Promise.resolve(); // Placeholder
    const school = getSchoolFromMemory(id);
    return school;
  } catch (error: any) {
    console.error(`Error fetching school with ID ${id} from memory:`, error);
    return null;
  }
}

/**
 * Updates a school's profile information in the in-memory store and optionally uploads a new logo to Firebase Storage.
 * Only callable by the school's admin.
 * @param schoolId The ID of the school to update.
 * @param data The data to update (address, phone, website, name).
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
  try {
    // 1. Verify Admin Permissions (Check in-memory store)
    const existingSchoolData = getSchoolFromMemory(schoolId);
    if (!existingSchoolData) {
      throw new Error('School not found in memory.');
    }
    if (existingSchoolData.adminUid !== currentAdminUid) {
      throw new Error('Permission denied: Only the assigned admin can update this school.');
    }

    const updateData: Partial<Omit<School, 'id' | 'createdAt' | 'updatedAt'>> = {};
    let needsUpdate = false;

    // Add provided fields to updateData if they exist and are defined
    if (data.hasOwnProperty('address') && data.address !== existingSchoolData.address) {
        updateData.address = data.address ?? null;
        needsUpdate = true;
    }
    if (data.hasOwnProperty('phone') && data.phone !== existingSchoolData.phone) {
         updateData.phone = data.phone ?? null;
         needsUpdate = true;
    }
    if (data.hasOwnProperty('website') && data.website !== existingSchoolData.website) {
        updateData.website = data.website ?? null;
        needsUpdate = true;
    }
    if (data.hasOwnProperty('name') && data.name !== undefined && data.name !== existingSchoolData.name) {
         updateData.name = data.name;
         needsUpdate = true;
    }


    // 2. Handle Logo Upload (if provided - Storage interaction remains)
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
          console.warn(`Could not delete previous logo (${existingSchoolData.logoUrl}): ${deleteError.message}`);
        }
      }

      // Upload the new logo
      const uploadResult = await uploadBytes(logoStorageRef, logoFile);
      newLogoUrl = await getDownloadURL(uploadResult.ref);
      updateData.logoUrl = newLogoUrl; // Add the new URL to the memory update
      needsUpdate = true;
      console.log(`Logo uploaded successfully for school ${schoolId}. URL: ${newLogoUrl}`);
    } else if (updateData.hasOwnProperty('logoUrl') && updateData.logoUrl !== existingSchoolData.logoUrl) {
        // Handle case where logoUrl might be explicitly set to null in `data` (though schema doesn't allow)
        needsUpdate = true;
    }


    // 3. Update In-Memory Store
    let finalSchoolData: School | null = existingSchoolData; // Start with existing
    if (needsUpdate) {
        const updatedSchool = updateSchoolInMemory(schoolId, updateData);
        if (!updatedSchool) {
            // Should not happen if check at start passed, but handle defensively
            throw new Error('Failed to update school in memory after initial check.');
        }
        finalSchoolData = updatedSchool;
        console.log(`School profile updated successfully in-memory for ID: ${schoolId}`);

         // If school name or logo changed, update the admin's user profile in memory
         if (updateData.name || updateData.logoUrl) {
            const adminProfile = getUserFromMemory(currentAdminUid);
            if (adminProfile) {
                const userUpdates: Partial<User> = {};
                if (updateData.name) userUpdates.schoolName = updateData.name;
                if (updateData.hasOwnProperty('logoUrl')) userUpdates.schoolLogoUrl = updateData.logoUrl; // Update even if null
                updateUserInMemory(currentAdminUid, userUpdates);
            }
         }

    } else {
        console.log(`No changes detected for school profile ${schoolId}. Skipping in-memory update.`);
    }

    return finalSchoolData!; // Return the final state

  } catch (error: any) {
    console.error(`Error updating school profile for ID ${schoolId}:`, error);
     if (error.code?.startsWith('storage/')) { // Handle storage errors
        throw new Error(`Failed to update school logo: ${error.message}`);
     }
    throw new Error(`Failed to update school profile: ${error.message}`);
  }
}