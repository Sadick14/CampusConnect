'use server';
/**
 * @fileOverview Service functions for managing user data.
 * WARNING: Currently uses TEMPORARY In-Memory storage. Not for production.
 */

import type { User as FirebaseUser } from 'firebase/auth';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Keep Auth import
import { type School } from './school'; // Keep School import

// Import types from schemas
import {
    type User,
    type AdminUserFormData,
    type StudentWithContact
} from '@/schemas/user';

// Import in-memory store functions
import {
    addUserToMemory,
    getUserFromMemory,
    getAllUsersFromMemory,
    updateUserInMemory,
    setUserInMemory,
    getSchoolFromMemory, // Use memory version to get school details
    getUserByEmailFromMemory
} from '@/lib/in-memory-db';

console.warn('User Service: Using TEMPORARY In-Memory Database.');

/**
 * Fetches a user's profile from the in-memory store, including associated school details.
 * @param uid The Firebase Authentication UID / In-Memory Store Key of the user.
 * @returns A promise that resolves to a User object if found, or null.
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  if (!uid) {
      console.error('getUserProfile called with invalid UID:', uid);
      return null;
  }
  try {
    await Promise.resolve(); // Simulate async
    const user = getUserFromMemory(uid);

    if (user) {
      let schoolName = user.schoolName;
      let schoolLogoUrl = user.schoolLogoUrl;

      // If schoolId exists, try fetching school details from memory
      if (user.schoolId && user.role !== 'superadmin') {
        const schoolData = getSchoolFromMemory(user.schoolId);
        if (schoolData) {
          schoolName = schoolData.name;
          schoolLogoUrl = schoolData.logoUrl;

           // Check if denormalized fields need updating on the user in memory
           const updates: Partial<User> = {};
           if (schoolName !== user.schoolName) updates.schoolName = schoolName ?? null;
           if (schoolLogoUrl !== user.schoolLogoUrl) updates.schoolLogoUrl = schoolLogoUrl ?? null;

           if (Object.keys(updates).length > 0) {
                console.log(`[In-Memory] Updating denormalized school info for user ${uid}`);
                updateUserInMemory(uid, updates); // Update memory
                // Need to return the updated user data
                return { ...user, ...updates };
           }

        } else {
            console.warn(`[In-Memory] School ${user.schoolId} not found for user ${uid}. Clearing denormalized info.`);
            schoolName = null;
            schoolLogoUrl = null;
            if (user.schoolName || user.schoolLogoUrl) {
                updateUserInMemory(uid, { schoolName: null, schoolLogoUrl: null });
                return { ...user, schoolName: null, schoolLogoUrl: null };
            }
        }
      }

      // Return user data (potentially updated with school info)
      return {
          ...user,
          schoolName: schoolName,
          schoolLogoUrl: schoolLogoUrl,
      };
    } else {
      console.warn(`[In-Memory] No profile found for user UID: ${uid}.`);
      return null;
    }
  } catch (error: any) {
    console.error(`[In-Memory] Error fetching user profile for UID ${uid}:`, error);
    return null;
  }
}

/**
 * Creates or updates the user's profile in the in-memory store *during the login process*.
 * Fetches the existing profile from memory itself.
 * @param firebaseUser The Firebase Auth user object.
 * @returns Promise resolving to the User profile from the in-memory store.
 * @throws Error if profile creation/update fails critically.
 */
export async function syncUserProfileOnLogin(
  firebaseUser: FirebaseUser
): Promise<User> {
    console.log(`[User Service - Memory] Syncing profile for UID: ${firebaseUser.uid}`);
    // Fetch existing profile directly from memory here
    const profileInMemory = getUserFromMemory(firebaseUser.uid);
    let needsWrite = !profileInMemory; // Write if profile doesn't exist
    let schoolDataFetched: School | null = null;

    let profileDataToSave: Partial<User> & { id: string } = {
        ...(profileInMemory || {}), // Start with existing data or empty object
        id: firebaseUser.uid, // Ensure ID is always the auth UID
    };

    // --- 1. Fetch School Info from Memory if user has schoolId ---
    const currentSchoolId = profileDataToSave.schoolId;
    if (currentSchoolId && firebaseUser.uid !== 'superadmin') {
      schoolDataFetched = getSchoolFromMemory(currentSchoolId);
      if (!schoolDataFetched) {
        console.warn(`[In-Memory Sync] User ${firebaseUser.uid} has schoolId ${currentSchoolId}, but school not found. Clearing association.`);
        if (profileDataToSave.schoolId) needsWrite = true;
        profileDataToSave.schoolId = null;
        profileDataToSave.schoolName = null;
        profileDataToSave.schoolLogoUrl = null;
      }
    }

    // --- 2. Determine/Verify Role (Superadmin override) ---
    if (firebaseUser.uid === 'superadmin') {
        if (profileDataToSave.role !== 'superadmin' || profileDataToSave.schoolId !== null) {
            profileDataToSave.role = 'superadmin';
            profileDataToSave.schoolId = null;
            profileDataToSave.schoolName = null;
            profileDataToSave.schoolLogoUrl = null;
            needsWrite = true;
        }
    } else if (!profileDataToSave.role) {
        // If role doesn't exist (new profile likely), default to student
        profileDataToSave.role = 'student'; // Default role if not superadmin and no role exists
        needsWrite = true;
    }

    // --- 3. Sync Basic Info ---
    const authName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous User';
    if (!profileDataToSave.name || profileDataToSave.name !== authName) {
        profileDataToSave.name = authName;
        needsWrite = true;
    }
    // Sync email only if it exists on firebaseUser and is different or missing in profile
    if (firebaseUser.email && profileDataToSave.email !== firebaseUser.email) {
        profileDataToSave.email = firebaseUser.email;
        needsWrite = true;
    }


    // --- 4. Set/Sync School Details from Memory ---
     if (firebaseUser.uid !== 'superadmin') {
         const currentSchoolName = schoolDataFetched?.name ?? null;
         const currentLogoUrl = schoolDataFetched?.logoUrl ?? null;

         if (profileDataToSave.schoolName !== currentSchoolName) {
             profileDataToSave.schoolName = currentSchoolName;
             needsWrite = true;
         }
         if (profileDataToSave.schoolLogoUrl !== currentLogoUrl) {
             profileDataToSave.schoolLogoUrl = currentLogoUrl;
             needsWrite = true;
         }
         // Ensure schoolId matches fetched data, important if school was deleted
         if (profileDataToSave.schoolId !== (schoolDataFetched?.id ?? null)) {
              profileDataToSave.schoolId = schoolDataFetched?.id ?? null;
              needsWrite = true;
         }
     }


    // --- 5. Add createdAt if creating new profile ---
    if (!profileInMemory) {
        profileDataToSave.createdAt = new Date().toISOString();
        needsWrite = true;
    }

    // --- 6. Perform Write only if necessary ---
    let finalProfile: User;
    if (needsWrite) {
        try {
            // Set/Update user in memory
            // Ensure all required fields are present before casting and saving
            const userToSave: User = {
              id: profileDataToSave.id!,
              name: profileDataToSave.name!,
              email: profileDataToSave.email!,
              role: profileDataToSave.role!,
              schoolId: profileDataToSave.schoolId ?? null,
              schoolName: profileDataToSave.schoolName ?? null,
              schoolLogoUrl: profileDataToSave.schoolLogoUrl ?? null,
              createdAt: profileDataToSave.createdAt ?? new Date().toISOString(), // Ensure createdAt exists
              updatedAt: new Date().toISOString(), // Always set updatedAt
              class: profileDataToSave.class ?? null,
              parentContact: profileDataToSave.parentContact ?? null,
            };

            finalProfile = setUserInMemory(userToSave);
            console.log(`[In-Memory Sync] User profile synced/created for UID: ${firebaseUser.uid}`);
        } catch (error: any) {
            console.error(`[In-Memory Sync] Error syncing user profile for UID ${firebaseUser.uid}:`, error);
            throw new Error(`Failed to create/update user profile in memory: ${error.message}`);
        }
    } else {
        // If no write needed, ensure the profileInMemory is not null before returning
        if (!profileInMemory) {
             // This case should ideally not happen if needsWrite logic is correct, but handle defensively
             console.error(`[In-Memory Sync] Inconsistent state: No write needed, but profileInMemory is null for UID: ${firebaseUser.uid}. Re-syncing.`);
             // Force a sync/creation attempt
             return await syncUserProfileOnLogin(firebaseUser); // Re-call to ensure creation
        }
        finalProfile = profileInMemory;
        console.log(`[In-Memory Sync] User profile for ${firebaseUser.uid} is up-to-date. No sync needed.`);
    }

    // --- 7. Return the final profile state ---
    // Ensure the returned object conforms to the User interface fully
    return {
        id: finalProfile.id,
        name: finalProfile.name,
        email: finalProfile.email,
        role: finalProfile.role,
        schoolId: finalProfile.schoolId ?? null,
        schoolName: finalProfile.schoolName ?? null,
        schoolLogoUrl: finalProfile.schoolLogoUrl ?? null,
        createdAt: finalProfile.createdAt,
        updatedAt: finalProfile.updatedAt,
        class: finalProfile.class ?? null,
        parentContact: finalProfile.parentContact ?? null,
    };
}



/**
 * Retrieves all users (for superadmin) or users for a specific school (for school_admin) from memory.
 * @param forSchoolId Optional school ID to filter users by.
 * @returns A promise that resolves to an array of User objects.
 */
export async function getUsers(forSchoolId?: string): Promise<User[]> {
  try {
    await Promise.resolve(); // Simulate async
    const userList = getAllUsersFromMemory(forSchoolId);

    // Optionally re-fetch school details for consistency check (might be overkill for memory store)
    const checkedUserList = userList.map(user => {
        let schoolName = user.schoolName;
        let schoolLogoUrl = user.schoolLogoUrl;
        if (user.schoolId && user.role !== 'superadmin') {
            const school = getSchoolFromMemory(user.schoolId);
            schoolName = school?.name ?? null;
            schoolLogoUrl = school?.logoUrl ?? null;
        }
        return { ...user, schoolName, schoolLogoUrl };
    });

    console.log(`[In-Memory] Fetched ${checkedUserList.length} users.`);
    return checkedUserList;
  } catch (error: any) {
    console.error('[In-Memory] Error fetching users:', error);
    return [];
  }
}

/**
 * Admin action to create a new user profile (Auth and In-Memory).
 * @param userData Data for the new user profile.
 * @param creatingAdminRole The role of the admin performing the action.
 * @param creatingAdminSchoolId The school ID of the school admin (if applicable).
 * @returns A promise that resolves to the created User object.
 */
export async function adminCreateUserProfile(
    userData: Omit<AdminUserFormData, 'id'>,
    creatingAdminRole: string,
    creatingAdminSchoolId?: string | null // Allow null
): Promise<User> {
    // --- Permission Checks (same as before) ---
    if (creatingAdminRole !== 'superadmin' && creatingAdminRole !== 'school_admin') {
        throw new Error("Permission denied: Only admins can create users.");
    }
     if (!userData.password) {
        throw new Error("Password is required to create a new user.");
    }
    let effectiveSchoolId = userData.schoolId;
     if ((userData.role === 'teacher' || userData.role === 'student') && !effectiveSchoolId) {
          if(creatingAdminRole === 'school_admin' && creatingAdminSchoolId) {
               effectiveSchoolId = creatingAdminSchoolId;
          } else {
               // Allow superadmin to create teacher/student without immediate school assignment
               if(creatingAdminRole !== 'superadmin') {
                   throw new Error(`School ID is required for role '${userData.role}' when created by a School Admin.`);
               }
               effectiveSchoolId = null; // Superadmin can create without assigning
          }
     }
      if (userData.email === 'superadmin@example.com') {
        throw new Error("Cannot create user with the reserved superadmin email.");
      }
      if (getUserByEmailFromMemory(userData.email)) {
           throw new Error(`Create failed: The email address ${userData.email} is already in use in the in-memory store.`);
      }


    // --- 1. Create Firebase Auth User (same as before) ---
    let authUser: FirebaseUser;
    try {
        console.log(`[Admin Create] Attempting to create Auth user for ${userData.email}...`);
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        authUser = userCredential.user;
        console.log(`[Admin Create] Auth user created successfully with UID: ${authUser.uid}`);
        await updateProfile(authUser, { displayName: userData.name });
    } catch (error: any) {
        console.error(`Error creating Firebase Auth user for ${userData.email}:`, error);
        if (error.code === 'auth/email-already-in-use') {
            throw new Error(`Authentication failed: The email address ${userData.email} is already in use by another account.`);
        }
        throw new Error(`Failed to create user authentication account: ${error.message}`);
    }

    // --- 2. Prepare and Create In-Memory User Profile ---
    const profileToCreate: Partial<User> & { id: string } = {
        id: authUser.uid, // Use Auth UID as key
        name: userData.name,
        email: userData.email,
        role: userData.role,
        schoolId: effectiveSchoolId ?? null, // Use the determined schoolId
        schoolName: null,
        schoolLogoUrl: null,
        class: (userData.role === 'student' ? userData.class : null) ?? null,
        parentContact: (userData.role === 'student' ? userData.parentContact : null) ?? null,
    };

    // Fetch school details from memory if schoolId is provided
    if (profileToCreate.schoolId) {
        const schoolDetails = getSchoolFromMemory(profileToCreate.schoolId);
        if (schoolDetails) {
             profileToCreate.schoolName = schoolDetails.name ?? null;
             profileToCreate.schoolLogoUrl = schoolDetails.logoUrl ?? null;
             console.log(`[Admin Create] Assigning user ${userData.email} to school: ${profileToCreate.schoolName} (${profileToCreate.schoolId})`);
        } else {
            console.warn(`[Admin Create] Provided non-existent school ID ${profileToCreate.schoolId} for user ${userData.email}. Setting school assignment to null.`);
            profileToCreate.schoolId = null; // Correct the ID if school doesn't exist
        }
    }

    // Create the In-Memory record
    try {
       // Ensure all required fields are present before casting and saving
        const userToSave: User = {
          id: profileToCreate.id!,
          name: profileToCreate.name!,
          email: profileToCreate.email!,
          role: profileToCreate.role!,
          schoolId: profileToCreate.schoolId ?? null,
          schoolName: profileToCreate.schoolName ?? null,
          schoolLogoUrl: profileToCreate.schoolLogoUrl ?? null,
          createdAt: new Date().toISOString(), // Set createdAt
          updatedAt: new Date().toISOString(), // Set updatedAt
          class: profileToCreate.class ?? null,
          parentContact: profileToCreate.parentContact ?? null,
        };
        const createdProfile = addUserToMemory(userToSave);
        console.log(`[Admin Create] Successfully created in-memory profile for ${userData.email} with ID ${authUser.uid}`);
        return createdProfile;
    } catch (error: any) {
        console.error(`[Admin Create] Error setting in-memory user profile document for ${userData.email} (UID: ${authUser.uid}):`, error);
        // Attempt to delete the created Auth user if Firestore write fails? Risky.
        console.error(`CRITICAL: Failed to create in-memory profile for Auth user ${authUser.uid}.`);
        throw new Error(`Failed to create in-memory profile: ${error.message}`);
    }
}


/**
 * Admin action to update an existing user's profile in the in-memory store.
 * @param userId The ID of the user profile to update.
 * @param updates Partial data for the user profile.
 * @param updatingAdminRole Role of the admin performing the action.
 * @param updatingAdminSchoolId School ID of the admin (if school_admin).
 * @returns A promise that resolves to the updated User object.
 */
export async function adminUpdateUserProfile(
    userId: string,
    updates: Partial<AdminUserFormData>,
    updatingAdminRole: string,
    updatingAdminSchoolId?: string | null // Allow null
): Promise<User> {
   if (updatingAdminRole !== 'superadmin' && updatingAdminRole !== 'school_admin') {
        throw new Error("Permission denied: Only admins can update users.");
   }

   const existingUserData = getUserFromMemory(userId);
   if (!existingUserData) {
       throw new Error("User profile not found in memory.");
   }

   // --- Apply Authorization Rules (same logic) ---
   if (existingUserData.role === 'superadmin' && updatingAdminRole !== 'superadmin') {
       throw new Error("Only a superadmin can modify another superadmin's profile.");
   }
    if (userId === 'superadmin' && updates.role && updates.role !== 'superadmin') {
       throw new Error("The role of the primary superadmin (UID 'superadmin') cannot be changed.");
    }
    if (updatingAdminRole === 'school_admin') {
       if (!updatingAdminSchoolId) throw new Error("School admin must have a school ID.");
       if (existingUserData.schoolId !== updatingAdminSchoolId) {
           throw new Error("School admins can only edit users within their own school.");
       }
       // Prevent school admin from changing role to school_admin or superadmin
        if (updates.role && (updates.role === 'school_admin' || updates.role === 'superadmin')) {
             throw new Error("School admins cannot assign administrative roles.");
        }
        // Prevent school admin from changing schoolId (shouldn't be possible anyway via UI)
        if (updates.hasOwnProperty('schoolId') && updates.schoolId !== updatingAdminSchoolId) {
             throw new Error("School admins cannot change a user's school assignment.");
        }
    }

   // --- Prepare Data for Update ---
   const dataToUpdate: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> = {};
   let needsUpdate = false;
   let schoolChanged = false;

   // Cannot update email or password via this function
   if (updates.email && updates.email !== existingUserData.email) {
       console.warn(`Attempted to update email for ${userId}, which is not allowed via adminUpdateUserProfile.`);
   }
   if (updates.password) {
       console.warn(`Attempted to update password for ${userId}, which is not allowed via adminUpdateUserProfile.`);
   }


   if (updates.name !== undefined && updates.name !== existingUserData.name) {
     dataToUpdate.name = updates.name;
     needsUpdate = true;
   }
    if (updates.role && updates.role !== existingUserData.role) {
        dataToUpdate.role = updates.role;
        needsUpdate = true;
        if (updates.role === 'superadmin') {
            dataToUpdate.schoolId = null; dataToUpdate.schoolName = null; dataToUpdate.schoolLogoUrl = null; schoolChanged = true;
        }
         if (existingUserData.role === 'student' && updates.role !== 'student') {
            dataToUpdate.class = null; dataToUpdate.parentContact = null;
        }
    }
    if (updates.hasOwnProperty('schoolId') && updates.schoolId !== existingUserData.schoolId) {
        if (updatingAdminRole !== 'superadmin' && existingUserData.role !== 'superadmin') {
             throw new Error("Only superadmins can change a user's school assignment.");
        }
        const newSchoolId = updates.schoolId ?? null;
        dataToUpdate.schoolId = newSchoolId;
        schoolChanged = true; needsUpdate = true;
        if (newSchoolId) {
            const newSchoolData = getSchoolFromMemory(newSchoolId);
            if (!newSchoolData) {
                console.warn(`[Admin Update] Cannot assign user ${userId} to non-existent school ID: ${newSchoolId}. Setting to null.`);
                dataToUpdate.schoolId = null;
                dataToUpdate.schoolName = null;
                dataToUpdate.schoolLogoUrl = null;
            } else {
                dataToUpdate.schoolName = newSchoolData.name ?? null;
                dataToUpdate.schoolLogoUrl = newSchoolData.logoUrl ?? null;
            }
        } else {
            dataToUpdate.schoolName = null; dataToUpdate.schoolLogoUrl = null;
        }
    } else if (schoolChanged) {
       // Role might have changed to superadmin, ensure school fields are cleared
       dataToUpdate.schoolName = null; dataToUpdate.schoolLogoUrl = null;
    }

    const finalRole = updates.role || existingUserData.role;
    if (finalRole === 'student') {
        // Validate class is present if setting role to student or updating a student
         if (updates.role === 'student' && (!updates.class && !existingUserData.class)) {
            throw new Error("Class/Grade is required when setting role to student.");
         }
        if (updates.hasOwnProperty('class') && updates.class !== existingUserData.class) {
             dataToUpdate.class = updates.class ?? null; needsUpdate = true;
        }
        if (updates.hasOwnProperty('parentContact')) {
            const newContact = updates.parentContact ?? null;
            const oldContact = existingUserData.parentContact ?? null;
            // Simple JSON stringify comparison for changes
            if (JSON.stringify(newContact) !== JSON.stringify(oldContact)) {
                 dataToUpdate.parentContact = newContact; needsUpdate = true;
            }
        }
    }


  // --- Perform Update ---
  if (needsUpdate) {
    try {
        // Add updatedAt timestamp
        dataToUpdate.updatedAt = new Date().toISOString();
        const updatedUser = updateUserInMemory(userId, dataToUpdate);
        if (!updatedUser) throw new Error("Failed to update user in memory.");
        console.log(`[In-Memory Update] User profile updated for ID: ${userId}`);
        return updatedUser;
    } catch (error: any) {
        console.error(`[In-Memory Update] Error updating user profile for ID ${userId}:`, error);
        throw new Error(`Failed to update profile in memory: ${error.message}`);
    }
  } else {
      console.log(`[In-Memory Update] No actual changes to update for user ID: ${userId}.`);
      return existingUserData; // Return existing if no update occurred
  }
}


/** Placeholder - Super Admin Auth user must be created manually in Firebase Console */
export async function initializeSuperAdmin() {
    console.log(`Super Admin Auth user MUST be created manually in Firebase Console with UID: 'superadmin'.`);
    console.log(`[In-Memory DB] A placeholder profile for 'superadmin' is created/verified in memory.`);
    // Verify/create the superadmin profile in memory at startup
    const superAdmin = getUserFromMemory('superadmin');
    if (!superAdmin) {
         addUserToMemory({
            id: 'superadmin',
            name: 'Super Admin',
            email: 'superadmin@example.com', // Should match the manually created Auth user
            role: 'superadmin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
         });
         console.log("[In-Memory DB] Initialized default superadmin profile in memory.");
    } else {
         // Optional: Ensure the existing superadmin profile is correct
         if (superAdmin.role !== 'superadmin') {
             updateUserInMemory('superadmin', { role: 'superadmin', schoolId: null, schoolName: null, schoolLogoUrl: null });
             console.log("[In-Memory DB] Corrected role for existing superadmin profile.");
         }
    }
}

// Initialize super admin on server startup (or first import)
initializeSuperAdmin();


/**
 * Function to get students with parent/guardian contact for a specific school from memory.
 */
export async function getStudentsWithContacts(schoolId: string): Promise<StudentWithContact[]> {
    if (!schoolId) {
        throw new Error("School ID is required to fetch students.");
    }
    try {
        await Promise.resolve(); // Simulate async
        const allUsers = getAllUsersFromMemory(schoolId);
        const students = allUsers.filter(user => user.role === 'student');
        console.log(`[In-Memory] Fetched ${students.length} students for school ${schoolId}`);
        // The User type already includes parentContact, so we just return the filtered list.
        // Ensure the caller handles the StudentWithContact type correctly (it's compatible with User).
        return students as StudentWithContact[];
    } catch (error: any) {
         console.error(`[In-Memory] Error fetching students for school ${schoolId}:`, error);
         throw new Error("An unexpected error occurred while fetching students from memory.");
    }
}
