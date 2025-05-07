'use server';
/**
 * @fileOverview Service functions for managing user data.
 * WARNING: Currently uses TEMPORARY In-Memory storage. Not for production.
 */

// Remove Firestore imports
// import { doc, getDoc, setDoc, collection, getDocs, query, where, updateDoc, serverTimestamp, Timestamp, FirestoreError } from 'firebase/firestore';
// import { getDb } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Keep Auth import
import { getSchoolById, type School } from './school'; // Keep School import

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
 * @param firebaseUser The Firebase Auth user object.
 * @param existingProfileData Optional: Profile data from memory if fetched earlier.
 * @returns Promise resolving to the User profile from the in-memory store.
 * @throws Error if profile creation/update fails critically.
 */
export async function syncUserProfileOnLogin(
  firebaseUser: FirebaseUser,
  existingProfileData?: User | null
): Promise<User> {
    console.log(`[In-Memory] Syncing profile for UID: ${firebaseUser.uid}`);
    const profileInMemory = existingProfileData ?? getUserFromMemory(firebaseUser.uid);
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
        profileDataToSave.role = 'student'; // Default role
        needsWrite = true;
    }

    // --- 3. Sync Basic Info ---
    const authName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous User';
    if (!profileDataToSave.name || profileDataToSave.name !== authName) {
        profileDataToSave.name = authName;
        needsWrite = true;
    }
    if (profileDataToSave.email !== firebaseUser.email) {
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
            finalProfile = setUserInMemory(profileDataToSave as User); // Cast assumes all required fields are present now
            console.log(`[In-Memory Sync] User profile synced/created for UID: ${firebaseUser.uid}`);
        } catch (error: any) {
            console.error(`[In-Memory Sync] Error syncing user profile for UID ${firebaseUser.uid}:`, error);
            throw new Error(`Failed to create/update user profile in memory: ${error.message}`);
        }
    } else {
        finalProfile = profileInMemory!; // Use existing if no write needed
        console.log(`[In-Memory Sync] User profile for ${firebaseUser.uid} is up-to-date. No sync needed.`);
    }

    // --- 7. Return the final profile state ---
    return finalProfile;
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
    creatingAdminSchoolId?: string
): Promise<User> {
    // --- Permission Checks (same as before) ---
    if (creatingAdminRole !== 'superadmin' && creatingAdminRole !== 'school_admin') {
        throw new Error("Permission denied: Only admins can create users.");
    }
     if (!userData.password) {
        throw new Error("Password is required to create a new user.");
    }
     if ((userData.role === 'teacher' || userData.role === 'student') && !userData.schoolId) {
          if(creatingAdminRole === 'school_admin' && creatingAdminSchoolId) {
               userData.schoolId = creatingAdminSchoolId;
          } else {
               throw new Error(`School ID is required for role '${userData.role}'.`);
          }
     } // ... other permission checks ...
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
        // ... error handling ...
        throw new Error(`Failed to create user authentication account: ${error.message}`);
    }

    // --- 2. Prepare and Create In-Memory User Profile ---
    const profileToCreate: Partial<User> & { id: string } = {
        id: authUser.uid, // Use Auth UID as key
        name: userData.name,
        email: userData.email,
        role: userData.role,
        schoolId: userData.schoolId ?? null,
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
            profileToCreate.schoolId = null;
        }
    }

    // Create the In-Memory record
    try {
        const createdProfile = addUserToMemory(profileToCreate as Omit<User, 'createdAt' | 'updatedAt'> & { id: string }); // Cast assumes addUserToMemory handles timestamps
        console.log(`[Admin Create] Successfully created in-memory profile for ${userData.email} with ID ${authUser.uid}`);
        return createdProfile;
    } catch (error: any) {
        console.error(`[Admin Create] Error setting in-memory user profile document for ${userData.email} (UID: ${authUser.uid}):`, error);
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
    updatingAdminSchoolId?: string
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
       } // ... other school admin rules
    }

   // --- Prepare Data for Update ---
   const dataToUpdate: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> = {};
   let needsUpdate = false;
   let schoolChanged = false;

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
            if (!newSchoolData) throw new Error(`Cannot assign user to non-existent school ID: ${newSchoolId}`);
            dataToUpdate.schoolName = newSchoolData.name ?? null;
            dataToUpdate.schoolLogoUrl = newSchoolData.logoUrl ?? null;
        } else {
            dataToUpdate.schoolName = null; dataToUpdate.schoolLogoUrl = null;
        }
    } else if (schoolChanged) {
       // Role changed to superadmin, clear school fields
       dataToUpdate.schoolName = null; dataToUpdate.schoolLogoUrl = null;
    }

    const finalRole = updates.role || existingUserData.role;
    if (finalRole === 'student') {
        if (updates.hasOwnProperty('class') && updates.class !== existingUserData.class) {
             dataToUpdate.class = updates.class ?? null; needsUpdate = true;
        }
        if (updates.hasOwnProperty('parentContact')) {
            const newContact = updates.parentContact ?? null;
            const oldContact = existingUserData.parentContact ?? null;
            if (JSON.stringify(newContact) !== JSON.stringify(oldContact)) {
                 dataToUpdate.parentContact = newContact; needsUpdate = true;
            }
        }
    }


  // --- Perform Update ---
  if (needsUpdate) {
    try {
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
    console.log(`[In-Memory DB] A placeholder profile for 'superadmin' is created in memory.`);
}

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